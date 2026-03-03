import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/utils/draft_payment_manager.dart';
import 'package:simpels_mobile/widgets/payment/unified_payment_body.dart';
import 'package:simpels_mobile/widgets/payment/payment_success_dialog.dart';

/// Unified screen untuk:
/// 1. Pembayaran tagihan saja
/// 2. Top-up dompet saja
/// 3. Pembayaran tagihan + Top-up dompet sekaligus
/// 4. Multiple pembayaran tagihan sekaligus (+ optional topup)
class UnifiedPaymentScreen extends StatefulWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final double? topupNominal;
  final double? tabunganNominal;
  final String? santriName;
  final bool shouldIncludeTopup;
  final int? selectedBankId;
  
  // For multiple payment
  final bool isMultiplePayment;
  final List<dynamic>? multipleTagihan;
  
  // To prevent auto-save when opened from draft
  final bool fromDraft;

  const UnifiedPaymentScreen({
    super.key,
    this.tagihan,
    this.isTopupOnly = false,
    this.topupNominal,
    this.tabunganNominal,
    this.santriName,
    this.shouldIncludeTopup = false,
    this.selectedBankId,
    this.isMultiplePayment = false,
    this.multipleTagihan,
    this.fromDraft = false,
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
  double _tabunganAmount = 0;
  String? _draftKey;
  late DraftPaymentManager _draftManager;

  @override
  void initState() {
    super.initState();
    _draftManager = DraftPaymentManager(
      draftKey: null,
      tagihan: widget.tagihan,
      selectedBankId: widget.selectedBankId,
      isMultiplePayment: widget.isMultiplePayment,
      fromDraft: widget.fromDraft,
      multipleTagihan: widget.multipleTagihan,
    );
    _loadDraftOrParams();
  }

  Future<void> _loadDraftOrParams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;

    _setAmountsFromParams();

    if (santriId != null) {
      if (widget.isMultiplePayment || widget.fromDraft) {
        _draftKey = null;
        return;
      }

      _draftKey = 'payment_draft_${santriId}_${widget.tagihan?['id'] ?? 'topup'}';
      final prefs = await SharedPreferences.getInstance();
      final draftJson = prefs.getString(_draftKey!);

      if (draftJson != null) {
        final draft = json.decode(draftJson);
        final draftPayment = draft['paymentAmount'] ?? 0.0;
        final draftTopup = draft['topupAmount'] ?? 0.0;

        if (_paymentAmount == draftPayment && _topupAmount == draftTopup) {
          setState(() => _catatanController.text = draft['catatan'] ?? '');
        } else {
          setState(() {
            _paymentAmount = draftPayment;
            _topupAmount = draftTopup;
            _catatanController.text = draft['catatan'] ?? '';
          });
          if (mounted) {
            DraftPaymentManager.showDraftDialog(context, onReset: () {
              _setAmountsFromParams();
              _draftManager.clear(context);
            });
          }
        }
      }
    }
  }

  void _setAmountsFromParams() {
    setState(() {
      if (widget.isMultiplePayment && widget.multipleTagihan != null) {
        double total = 0;
        for (var tagihan in widget.multipleTagihan!) {
          if (tagihan is Map) total += double.tryParse(tagihan['sisa']?.toString() ?? '0') ?? 0;
        }
        _paymentAmount = total;
        if (widget.topupNominal != null && widget.topupNominal! > 0) _topupAmount = widget.topupNominal!;
        if (widget.tabunganNominal != null && widget.tabunganNominal! > 0) _tabunganAmount = widget.tabunganNominal!;
      } else if (widget.isTopupOnly && widget.topupNominal != null) {
        _topupAmount = widget.topupNominal!;
      } else if (widget.tagihan != null) {
        _paymentAmount = double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0;
        if (widget.topupNominal != null && widget.topupNominal! > 0) _topupAmount = widget.topupNominal!;
        if (widget.tabunganNominal != null && widget.tabunganNominal! > 0) _tabunganAmount = widget.tabunganNominal!;
      }
    });
  }

  @override
  void dispose() {
    _catatanController.dispose();
    if (!_submitSuccess && !widget.fromDraft && !widget.isMultiplePayment) {
      _draftManager.save(
        paymentAmount: _paymentAmount,
        topupAmount: _topupAmount,
        catatan: _catatanController.text,
      );
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

    double? paymentAmount = _paymentAmount > 0 ? _paymentAmount : null;
    double? topupAmount = _topupAmount > 0 ? _topupAmount : null;
    List<int>? tagihanIds;

    if (widget.isTopupOnly) {
      if (topupAmount == null || topupAmount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Nominal top-up tidak valid')),
        );
        return;
      }
    } else if (widget.isMultiplePayment && widget.multipleTagihan != null) {
      tagihanIds = widget.multipleTagihan!
          .map((t) => t is Map ? t['id'] as int? : null)
          .where((id) => id != null)
          .cast<int>()
          .toList();
      if (tagihanIds.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak ada tagihan valid')),
        );
        return;
      }
    } else {
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
      final totalNominal = (paymentAmount ?? 0) + (topupAmount ?? 0) + _tabunganAmount;

      final response = await apiService.uploadBuktiTransfer(
        santriId: santriId,
        tagihanIds: tagihanIds ?? [],
        totalNominal: totalNominal,
        buktiFile: _selectedFile,
        buktiBytes: _webImage,
        catatan: _buildCatatan(paymentAmount, topupAmount, _tabunganAmount),
        nominalTopup: topupAmount,
        nominalTabungan: _tabunganAmount > 0 ? _tabunganAmount : null,
        selectedBankId: widget.selectedBankId,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        _submitSuccess = true;
        await _draftManager.clear(context);

        if (mounted) {
          await showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => PaymentSuccessDialog(
              message: _buildSuccessMessage(topupAmount),
            ),
          );
        }
      } else {
        throw Exception(response.data['error'] ?? 'Gagal submit bukti transfer');
      }
    } catch (e) {
      debugPrint('[Submit Payment Error] $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String _buildSuccessMessage(double? topupAmount) {
    if (widget.isTopupOnly) return 'Top-up berhasil dikirim! Tunggu konfirmasi admin.';
    if (widget.isMultiplePayment) {
      final count = widget.multipleTagihan?.length ?? 0;
      return topupAmount != null && topupAmount > 0
          ? '$count tagihan + top-up berhasil dikirim! Tunggu konfirmasi admin.'
          : '$count tagihan berhasil dikirim! Tunggu konfirmasi admin.';
    }
    return topupAmount != null && topupAmount > 0
        ? 'Pembayaran dan top-up berhasil dikirim! Tunggu konfirmasi admin.'
        : 'Pembayaran berhasil dikirim! Tunggu konfirmasi admin.';
  }

  String _buildCatatan(double? paymentAmount, double? topupAmount, double? tabunganAmount) {
    String catatan = _catatanController.text.trim();
    
    if (widget.isTopupOnly) {
      return catatan.isEmpty
          ? 'Top-up dompet sebesar Rp ${_formatCurrency(topupAmount ?? 0)}'
          : 'Top-up: Rp ${_formatCurrency(topupAmount ?? 0)}. $catatan';
    }

    // Build combined transaction description
    List<String> parts = [];
    if (paymentAmount != null && paymentAmount > 0) {
      parts.add('Pembayaran: Rp ${_formatCurrency(paymentAmount)}');
    }
    if (topupAmount != null && topupAmount > 0) {
      parts.add('Top-up: Rp ${_formatCurrency(topupAmount)}');
    }
    if (tabunganAmount != null && tabunganAmount > 0) {
      parts.add('Setor tabungan: Rp ${_formatCurrency(tabunganAmount)}');
    }
    
    String transactionDesc = parts.join(' + ');
    
    return catatan.isEmpty ? transactionDesc : '$transactionDesc. $catatan';
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  @override
  Widget build(BuildContext context) {
    return UnifiedPaymentBody(
      tagihan: widget.tagihan,
      isTopupOnly: widget.isTopupOnly,
      isMultiplePayment: widget.isMultiplePayment,
      multipleTagihan: widget.multipleTagihan,
      santriName: widget.santriName,
      paymentAmount: _paymentAmount,
      topupAmount: _topupAmount,
      tabunganAmount: _tabunganAmount,
      selectedFile: _selectedFile,
      webImage: _webImage,
      catatanController: _catatanController,
      isSubmitting: _isSubmitting,
      onPickImage: _showImageSourceDialog,
      onRemoveImage: () => setState(() {
        _selectedFile = null;
        _webImage = null;
      }),
      onSubmit: _submitPayment,
      formatCurrency: _formatCurrency,
    );
  }
}
