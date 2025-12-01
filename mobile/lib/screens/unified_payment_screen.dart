import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/announcement_badge.dart';

/// Unified screen untuk:
/// 1. Pembayaran tagihan saja
/// 2. Top-up dompet saja  
/// 3. Pembayaran tagihan + Top-up dompet sekaligus
class UnifiedPaymentScreen extends StatefulWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final double? topupNominal;
  final String? santriName;
  final bool shouldIncludeTopup;
  final int? selectedBankId;

  const UnifiedPaymentScreen({
    super.key,
    this.tagihan,
    this.isTopupOnly = false,
    this.topupNominal,
    this.santriName,
    this.shouldIncludeTopup = false,
    this.selectedBankId,
  });

  @override
  State<UnifiedPaymentScreen> createState() => _UnifiedPaymentScreenState();
}

class _UnifiedPaymentScreenState extends State<UnifiedPaymentScreen> {
  File? _selectedFile;
  Uint8List? _webImage;
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _catatanController = TextEditingController();
  bool _isSubmitting = false;
  bool _submitSuccess = false; // Track if payment was successfully submitted
  
  double _paymentAmount = 0;
  double _topupAmount = 0;
  String? _draftKey;

  @override
  void initState() {
    super.initState();
    _loadDraftOrParams();
  }
  
  Future<void> _loadDraftOrParams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;
    
    // First, set values from parameters (might be from draft list navigation)
    setState(() {
      if (widget.isTopupOnly && widget.topupNominal != null) {
        _topupAmount = widget.topupNominal!;
      } else if (widget.tagihan != null) {
        _paymentAmount = double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0;
        if (widget.topupNominal != null && widget.topupNominal! > 0) {
          _topupAmount = widget.topupNominal!;
        }
      }
    });
    
    if (santriId != null) {
      // Generate unique draft key
      _draftKey = 'payment_draft_${santriId}_${widget.tagihan?['id'] ?? 'topup'}';
      
      // Try load draft from storage (only if not coming from draft navigation)
      final prefs = await SharedPreferences.getInstance();
      final draftJson = prefs.getString(_draftKey!);
      
      if (draftJson != null) {
        // Ada draft tersimpan
        final draft = json.decode(draftJson);
        
        // Only show dialog if values don't match (means user came from normal flow, not draft)
        final draftPayment = draft['paymentAmount'] ?? 0.0;
        final draftTopup = draft['topupAmount'] ?? 0.0;
        
        if (_paymentAmount == draftPayment && _topupAmount == draftTopup) {
          // Coming from draft navigation, just use the values, no dialog
          setState(() {
            _catatanController.text = draft['catatan'] ?? '';
          });
        } else {
          // Coming from normal flow, show dialog to continue or reset
          setState(() {
            _paymentAmount = draftPayment;
            _topupAmount = draftTopup;
            _catatanController.text = draft['catatan'] ?? '';
          });
          
          if (mounted) {
            _showDraftDialog();
          }
        }
      }
    }
  }
  
  Future<void> _saveDraft() async {
    if (_draftKey == null) return;
    
    final prefs = await SharedPreferences.getInstance();
    
    // Get tagihan details
    final jumlah = widget.tagihan != null 
        ? (double.tryParse(widget.tagihan!['nominal']?.toString() ?? 
            widget.tagihan!['jumlah']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sudahDibayar = widget.tagihan != null
        ? (double.tryParse(widget.tagihan!['dibayar']?.toString() ?? 
            widget.tagihan!['sudah_dibayar']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    
    final draft = {
      'paymentAmount': _paymentAmount,
      'topupAmount': _topupAmount,
      'catatan': _catatanController.text,
      'timestamp': DateTime.now().toIso8601String(),
      'tagihanId': widget.tagihan?['id'],
      'jenisTagihan': widget.tagihan?['jenis_tagihan'],
      'bulan': widget.tagihan?['bulan'],
      'tahun': widget.tagihan?['tahun'],
      'selectedBankId': widget.selectedBankId,
      'totalTagihan': jumlah,
      'sudahDibayar': sudahDibayar,
    };
    
    await prefs.setString(_draftKey!, json.encode(draft));
  }
  
  Future<void> _clearDraft() async {
    if (_draftKey == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_draftKey!);
  }
  
  void _showDraftDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Pembayaran Tersimpan'),
        content: const Text(
          'Anda memiliki draft pembayaran yang belum selesai. Lanjutkan pembayaran atau mulai dari awal?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              _clearDraft();
              Navigator.pop(context);
              // Reset to params
              setState(() {
                if (widget.isTopupOnly && widget.topupNominal != null) {
                  _topupAmount = widget.topupNominal!;
                } else if (widget.tagihan != null) {
                  _paymentAmount = double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0;
                  if (widget.topupNominal != null) {
                    _topupAmount = widget.topupNominal!;
                  }
                }
              });
            },
            child: const Text('Mulai Baru'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Lanjutkan'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _catatanController.dispose();
    // Only save draft if payment was NOT successfully submitted
    if (!_submitSuccess) {
      _saveDraft(); // Auto-save saat keluar
    }
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        if (kIsWeb) {
          final bytes = await pickedFile.readAsBytes();
          setState(() {
            _webImage = bytes;
            _selectedFile = null;
          });
        } else {
          setState(() {
            _selectedFile = File(pickedFile.path);
            _webImage = null;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error memilih gambar: $e')),
        );
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            if (!kIsWeb)
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Ambil Foto'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Pilih dari Galeri'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitPayment() async {
    if (_selectedFile == null && _webImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih bukti transfer terlebih dahulu')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;
    
    if (santriId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Data santri tidak valid')),
      );
      return;
    }

    // Use amounts from state (already set from params or draft)
    double? paymentAmount = _paymentAmount > 0 ? _paymentAmount : null;
    double? topupAmount = _topupAmount > 0 ? _topupAmount : null;
    List<int>? tagihanIds;

    if (widget.isTopupOnly) {
      // Mode top-up saja
      if (topupAmount == null || topupAmount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Nominal top-up tidak valid')),
        );
        return;
      }
    } else {
      // Mode pembayaran tagihan
      if (paymentAmount == null || paymentAmount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Nominal pembayaran tidak valid')),
        );
        return;
      }
      
      final tagihanId = widget.tagihan?['id'];
      if (tagihanId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Data tagihan tidak valid')),
        );
        return;
      }
      tagihanIds = [tagihanId as int];
    }

    setState(() => _isSubmitting = true);

    try {
      final apiService = ApiService();
      
      // Calculate total nominal
      final totalNominal = (paymentAmount ?? 0) + (topupAmount ?? 0);

      // Upload bukti transfer menggunakan endpoint yang sudah ada
      final response = await apiService.uploadBuktiTransfer(
        santriId: santriId,
        tagihanIds: tagihanIds ?? [],
        totalNominal: totalNominal,
        buktiFile: _selectedFile,
        buktiBytes: _webImage,
        catatan: _buildCatatan(paymentAmount, topupAmount),
        nominalTopup: topupAmount,
        selectedBankId: widget.selectedBankId,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Mark as successfully submitted
        _submitSuccess = true;
        
        // Clear draft setelah berhasil submit
        await _clearDraft();
        
        if (mounted) {
          final message = widget.isTopupOnly
              ? 'Top-up berhasil dikirim! Tunggu konfirmasi admin.'
              : topupAmount != null && topupAmount > 0
                  ? 'Pembayaran dan top-up berhasil dikirim! Tunggu konfirmasi admin.'
                  : 'Pembayaran berhasil dikirim! Tunggu konfirmasi admin.';
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(response.data['error'] ?? 'Gagal submit bukti transfer');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _buildCatatan(double? paymentAmount, double? topupAmount) {
    String catatan = _catatanController.text.trim();
    if (widget.isTopupOnly) {
      return catatan.isEmpty 
          ? 'Top-up dompet sebesar Rp ${_formatCurrency(topupAmount ?? 0)}'
          : 'Top-up: Rp ${_formatCurrency(topupAmount ?? 0)}. $catatan';
    } else if (topupAmount != null && topupAmount > 0) {
      return catatan.isEmpty
          ? 'Pembayaran tagihan: Rp ${_formatCurrency(paymentAmount ?? 0)} + Top-up dompet: Rp ${_formatCurrency(topupAmount)}'
          : 'Pembayaran: Rp ${_formatCurrency(paymentAmount ?? 0)} + Top-up: Rp ${_formatCurrency(topupAmount)}. $catatan';
    } else {
      return catatan.isEmpty
          ? 'Pembayaran tagihan sebesar Rp ${_formatCurrency(paymentAmount ?? 0)}'
          : 'Pembayaran: Rp ${_formatCurrency(paymentAmount ?? 0)}. $catatan';
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final isTopup = widget.isTopupOnly;
    
    // For payment mode, get tagihan details
    // Support both 'nominal' and 'jumlah' field names
    final jumlah = widget.tagihan != null 
        ? (double.tryParse(widget.tagihan!['nominal']?.toString() ?? 
            widget.tagihan!['jumlah']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sudahDibayar = widget.tagihan != null
        ? (double.tryParse(widget.tagihan!['dibayar']?.toString() ?? 
            widget.tagihan!['sudah_dibayar']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sisa = widget.tagihan != null
        ? (double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0.0)
        : 0.0;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(isTopup ? 'Upload Bukti Top-up' : 'Pembayaran Tagihan'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: const [
          AnnouncementBadge(),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info Card
            if (isTopup)
              Card(
                color: Colors.blue.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.account_balance_wallet, color: Colors.blue.shade700),
                          const SizedBox(width: 8),
                          Text(
                            'Informasi Top-up',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.blue.shade700,
                            ),
                          ),
                        ],
                      ),
                      if (widget.santriName != null) ...[
                        const SizedBox(height: 12),
                        _buildInfoRow('Santri', widget.santriName!),
                      ],
                    ],
                  ),
                ),
              )
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.tagihan?['jenis_tagihan'] ?? 'Tagihan',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.tagihan?['bulan'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          '${widget.tagihan!['bulan']} ${widget.tagihan!['tahun']}',
                          style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                        ),
                      ],
                      const Divider(height: 24),
                      _buildInfoRow('Total Tagihan', 'Rp ${_formatCurrency(jumlah)}'),
                      const SizedBox(height: 8),
                      _buildInfoRow('Sudah Dibayar', 'Rp ${_formatCurrency(sudahDibayar)}'),
                      const Divider(height: 24),
                      _buildInfoRow('Sisa Tagihan', 'Rp ${_formatCurrency(sisa)}', isBold: true),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // Nominal Pembayaran Card
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Nominal Pembayaran',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_paymentAmount > 0) ...[
                      _buildInfoRow('Pembayaran Tagihan', 'Rp ${_formatCurrency(_paymentAmount)}'),
                      const SizedBox(height: 8),
                    ],
                    if (_topupAmount > 0) ...[
                      _buildInfoRow('Top-up Dompet', 'Rp ${_formatCurrency(_topupAmount)}'),
                      const SizedBox(height: 8),
                    ],
                    const Divider(),
                    const SizedBox(height: 8),
                    _buildInfoRow(
                      'TOTAL TRANSFER',
                      'Rp ${_formatCurrency(_paymentAmount + _topupAmount)}',
                      isBold: true,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Upload Bukti Section
            const Text(
              'Bukti Transfer',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Upload bukti transfer dari bank/e-wallet',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 12),

            // Image Preview
            if (_selectedFile != null || _webImage != null)
              Container(
                width: double.infinity,
                height: 300,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: _webImage != null
                          ? Image.memory(
                              _webImage!,
                              width: double.infinity,
                              height: 300,
                              fit: BoxFit.cover,
                            )
                          : Image.file(
                              _selectedFile!,
                              width: double.infinity,
                              height: 300,
                              fit: BoxFit.cover,
                            ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black54,
                        ),
                        onPressed: () {
                          setState(() {
                            _selectedFile = null;
                            _webImage = null;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              )
            else
              InkWell(
                onTap: _showImageSourceDialog,
                child: Container(
                  width: double.infinity,
                  height: 150,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300, width: 2),
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.white,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cloud_upload, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text(
                        'Tap untuk upload bukti transfer',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                      if (kIsWeb)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '(Pilih gambar dari galeri)',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // Catatan
            const Text(
              'Catatan (Opsional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _catatanController,
              maxLines: 3,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Tambahkan catatan jika diperlukan...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),

            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitPayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        isTopup ? 'Kirim Bukti Top-up' : 'Kirim Pembayaran',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? Colors.black : Colors.grey,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
