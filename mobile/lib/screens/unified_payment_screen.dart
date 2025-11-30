import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:typed_data';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

/// Unified screen untuk:
/// 1. Pembayaran tagihan saja
/// 2. Top-up dompet saja  
/// 3. Pembayaran tagihan + Top-up dompet sekaligus
class UnifiedPaymentScreen extends StatefulWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final double? topupNominal;
  final String? santriName;

  const UnifiedPaymentScreen({
    super.key,
    this.tagihan,
    this.isTopupOnly = false,
    this.topupNominal,
    this.santriName,
  });

  @override
  State<UnifiedPaymentScreen> createState() => _UnifiedPaymentScreenState();
}

class _UnifiedPaymentScreenState extends State<UnifiedPaymentScreen> {
  File? _selectedFile;
  Uint8List? _webImage;
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _paymentController = TextEditingController();
  final TextEditingController _topupController = TextEditingController();
  final TextEditingController _catatanController = TextEditingController();
  bool _isSubmitting = false;
  bool _includeTopup = false;

  @override
  void initState() {
    super.initState();
    if (widget.isTopupOnly && widget.topupNominal != null) {
      _topupController.text = widget.topupNominal!.toStringAsFixed(0);
    } else if (widget.tagihan != null) {
      final sisa = double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0;
      _paymentController.text = sisa.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _paymentController.dispose();
    _topupController.dispose();
    _catatanController.dispose();
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

    // Validasi berdasarkan mode
    double? paymentAmount;
    double? topupAmount;
    List<int>? tagihanIds;

    if (widget.isTopupOnly) {
      // Mode top-up saja
      topupAmount = double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', ''));
      if (topupAmount == null || topupAmount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Masukkan jumlah top-up yang valid')),
        );
        return;
      }
      if (topupAmount < 10000) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Minimal top-up Rp 10.000')),
        );
        return;
      }
    } else {
      // Mode pembayaran tagihan
      paymentAmount = double.tryParse(_paymentController.text.replaceAll('.', '').replaceAll(',', ''));
      if (paymentAmount == null || paymentAmount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Masukkan jumlah pembayaran yang valid')),
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

      // Cek apakah ada top-up tambahan
      if (_includeTopup) {
        topupAmount = double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', ''));
        if (topupAmount != null && topupAmount > 0) {
          if (topupAmount < 10000) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Minimal top-up Rp 10.000')),
            );
            return;
          }
        } else {
          topupAmount = null; // Reset if invalid
        }
      }
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
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
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
    final jumlah = widget.tagihan != null 
        ? (double.tryParse(widget.tagihan!['jumlah']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sudahDibayar = widget.tagihan != null
        ? (double.tryParse(widget.tagihan!['sudah_dibayar']?.toString() ?? '0') ?? 0.0)
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

            // Amount Input
            if (isTopup)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Nominal Top-up',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _topupController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Jumlah Top-up (Rp)',
                      hintText: 'Minimal Rp 10.000',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixText: 'Rp ',
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                ],
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Nominal Pembayaran',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _paymentController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Jumlah Pembayaran (Rp)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixText: 'Rp ',
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Option to add topup
                  CheckboxListTile(
                    value: _includeTopup,
                    onChanged: (val) => setState(() => _includeTopup = val ?? false),
                    title: const Text('Sekaligus top-up dompet'),
                    subtitle: const Text('Tambahkan saldo ke dompet santri'),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                  
                  if (_includeTopup) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _topupController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Jumlah Top-up (Rp)',
                        hintText: 'Minimal Rp 10.000',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixText: 'Rp ',
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  ],
                ],
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
