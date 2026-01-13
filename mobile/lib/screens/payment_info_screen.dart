import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/bank_account.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'unified_payment_screen.dart';

/// Screen untuk menampilkan informasi pembayaran sebelum transfer
/// Menampilkan rekening bank tujuan dan total pembayaran
class PaymentInfoScreen extends StatefulWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final double? topupNominal;
  final String? santriName;

  const PaymentInfoScreen({
    super.key,
    this.tagihan,
    this.isTopupOnly = false,
    this.topupNominal,
    this.santriName,
  });

  @override
  State<PaymentInfoScreen> createState() => _PaymentInfoScreenState();
}

class _PaymentInfoScreenState extends State<PaymentInfoScreen> {
  List<BankAccount> _bankAccounts = [];
  BankAccount? _selectedBank;
  bool _loading = true;
  bool _includeTopup = false;
  final TextEditingController _topupController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBankAccounts();
  }

  @override
  void dispose() {
    _topupController.dispose();
    super.dispose();
  }

  Future<void> _loadBankAccounts() async {
    try {
      setState(() => _loading = true);
      final apiService = ApiService();
      final response = await apiService.getBankAccounts();

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        setState(() {
          _bankAccounts =
              data.map((json) => BankAccount.fromJson(json)).toList();
          if (_bankAccounts.isNotEmpty) {
            _selectedBank = _bankAccounts.first;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error memuat data rekening: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  double _calculateTotal() {
    double total = 0;

    if (widget.isTopupOnly) {
      total = widget.topupNominal ?? 0;
    } else if (widget.tagihan != null) {
      final sisa =
          double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0;
      total = sisa;

      if (_includeTopup) {
        final topupAmount = double.tryParse(_topupController.text
                .replaceAll('.', '')
                .replaceAll(',', '')) ??
            0;
        total += topupAmount;
      }
    }

    return total;
  }

  Future<void> _saveToDraft() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santriId = authProvider.activeSantri?.id;
      
      if (santriId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Santri tidak ditemukan')),
        );
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      
      // Save single payment draft
      final tagihanId = widget.tagihan?['id'];
      final draftKey = 'payment_draft_${santriId}_${tagihanId ?? 'topup'}';
      
      final paymentAmount = widget.isTopupOnly
          ? 0.0
          : (double.tryParse(widget.tagihan!['sisa']?.toString() ?? '0') ?? 0);
      
      final topupAmount = _includeTopup
          ? (double.tryParse(_topupController.text
                  .replaceAll('.', '')
                  .replaceAll(',', '')) ??
              0.0)
          : 0.0;
      
      final draft = {
        'paymentAmount': paymentAmount,
        'topupAmount': topupAmount,
        'catatan': '',
        'timestamp': DateTime.now().toIso8601String(),
        'tagihanId': tagihanId,
        'jenisTagihan': widget.tagihan?['jenis_tagihan'],
        'bulan': widget.tagihan?['bulan'],
        'tahun': widget.tagihan?['tahun'],
        'selectedBankId': _selectedBank?.id,
        'totalTagihan': double.tryParse(widget.tagihan?['nominal']?.toString() ?? '0') ?? 0,
        'sudahDibayar': double.tryParse(widget.tagihan?['dibayar']?.toString() ?? '0') ?? 0,
      };
      
      await prefs.setString(draftKey, json.encode(draft));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              topupAmount > 0
                  ? 'Tagihan + top-up disimpan ke draft'
                  : 'Tagihan disimpan ke draft'
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error menyimpan draft: $e')),
        );
      }
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Nomor rekening disalin ke clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _navigateToUpload() async {
    if (_selectedBank == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih rekening bank terlebih dahulu')),
      );
      return;
    }

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => UnifiedPaymentScreen(
          tagihan: widget.tagihan,
          isTopupOnly: widget.isTopupOnly,
          topupNominal: widget.isTopupOnly
              ? widget.topupNominal
              : (_includeTopup
                  ? double.tryParse(_topupController.text
                      .replaceAll('.', '')
                      .replaceAll(',', ''))
                  : null),
          santriName: widget.santriName,
          shouldIncludeTopup: _includeTopup,
          selectedBankId: _selectedBank!.id,
        ),
      ),
    );

    // Return result to previous screen (PembayaranTab) untuk trigger refresh
    if (mounted && result == true) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _calculateTotal();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Informasi Pembayaran'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _bankAccounts.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'Belum ada rekening bank yang tersedia',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Hubungi admin untuk informasi rekening',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Info card
                      if (widget.isTopupOnly)
                        Card(
                          color: Colors.blue.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.account_balance_wallet,
                                        color: Colors.blue.shade700),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Top-up Dompet',
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
                                  Text('Santri: ${widget.santriName}'),
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
                                    style: TextStyle(
                                        fontSize: 14, color: Colors.grey[600]),
                                  ),
                                ],
                                const Divider(height: 24),
                                _buildInfoRow('Sisa Tagihan',
                                    'Rp ${_formatCurrency(double.tryParse(widget.tagihan?['sisa']?.toString() ?? '0') ?? 0)}'),
                                if (_includeTopup) ...[
                                  const SizedBox(height: 8),
                                  _buildInfoRow('Top-up Dompet',
                                      'Rp ${_formatCurrency(double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0)}'),
                                ],
                              ],
                            ),
                          ),
                        ),

                      // Option to add topup (only for payment mode)
                      if (!widget.isTopupOnly) ...[
                        const SizedBox(height: 16),
                        CheckboxListTile(
                          value: _includeTopup,
                          onChanged: (val) =>
                              setState(() => _includeTopup = val ?? false),
                          title: const Text('Sekaligus top-up dompet'),
                          subtitle:
                              const Text('Tambahkan saldo ke dompet santri'),
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
                            onChanged: (_) =>
                                setState(() {}), // Rebuild untuk update total
                          ),
                        ],
                      ],

                      const SizedBox(height: 24),

                      // Total amount
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.shade700,
                              Colors.blue.shade900
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'Total yang Harus Ditransfer',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Rp ${_formatCurrency(total)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Bank selection
                      const Text(
                        'Transfer ke Rekening',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),

                      ..._bankAccounts.map((bank) {
                        final isSelected = _selectedBank?.id == bank.id;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedBank = bank),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected
                                    ? Colors.blue
                                    : Colors.grey.shade300,
                                width: isSelected ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              color: isSelected
                                  ? Colors.blue.shade50
                                  : Colors.white,
                            ),
                            child: Row(
                              children: [
                                Radio<int>(
                                  value: bank.id,
                                  groupValue: _selectedBank?.id,
                                  onChanged: (val) =>
                                      setState(() => _selectedBank = bank),
                                  activeColor: Colors.blue,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        bank.bankName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        bank.accountNumber,
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 15,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'a.n. ${bank.accountName}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.copy, size: 20),
                                  onPressed: () =>
                                      _copyToClipboard(bank.accountNumber),
                                  tooltip: 'Salin nomor rekening',
                                  color: Colors.blue,
                                ),
                              ],
                            ),
                          ),
                        );
                      }),

                      const SizedBox(height: 24),

                      // Important notes
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.warning_amber,
                                    color: Colors.amber.shade700),
                                const SizedBox(width: 8),
                                Text(
                                  'PENTING',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.amber.shade900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '• Transfer TEPAT sesuai nominal di atas\n'
                              '• Simpan bukti transfer (screenshot/foto struk)\n'
                              '• Upload bukti setelah transfer berhasil\n'
                              '• Tunggu konfirmasi dari admin',
                              style: TextStyle(
                                  fontSize: 13, color: Colors.grey[800]),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 100), // Space for bottom buttons
                    ],
                  ),
                ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _selectedBank == null
                    ? null
                    : _saveToDraft,
                icon: const Icon(Icons.save_outlined),
                label: const Text('Simpan Draft'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: BorderSide(color: Colors.blue.shade700),
                  foregroundColor: Colors.blue.shade700,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: _navigateToUpload,
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload Bukti Transfer'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
