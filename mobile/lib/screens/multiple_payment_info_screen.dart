import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:provider/provider.dart';
import '../models/bank_account.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'unified_payment_screen.dart';

/// Screen untuk menampilkan informasi pembayaran MULTIPLE tagihan
class MultiplePaymentInfoScreen extends StatefulWidget {
  final List<Map<String, dynamic>> selectedTagihan;

  const MultiplePaymentInfoScreen({
    super.key,
    required this.selectedTagihan,
  });

  @override
  State<MultiplePaymentInfoScreen> createState() =>
      _MultiplePaymentInfoScreenState();
}

class _MultiplePaymentInfoScreenState extends State<MultiplePaymentInfoScreen> {
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
    for (var tagihan in widget.selectedTagihan) {
      final sisa = double.tryParse(tagihan['sisa']?.toString() ?? '0') ?? 0;
      total += sisa;
    }
    
    // Add topup if included
    if (_includeTopup) {
      final topupAmount = double.tryParse(
              _topupController.text.replaceAll('.', '').replaceAll(',', '')) ??
          0;
      total += topupAmount;
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
      
      // Save as ONE draft with multiple tagihan
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final draftKey = 'payment_draft_multiple_${santriId}_$timestamp';
      
      final topupAmount = _includeTopup
          ? (double.tryParse(
                  _topupController.text.replaceAll('.', '').replaceAll(',', '')) ??
              0.0)
          : 0.0;
      
      final draft = {
        'isMultiple': true,
        'tagihan': widget.selectedTagihan,
        'topupAmount': topupAmount,
        'includeTopup': _includeTopup,
        'timestamp': DateTime.now().toIso8601String(),
        'selectedBankId': _selectedBank?.id,
        'totalPayment': _calculateTotal(),
      };
      
      debugPrint('[SaveDraft] Saving multiple payment draft');
      debugPrint('[SaveDraft] Tagihan count: ${widget.selectedTagihan.length}');
      debugPrint('[SaveDraft] Topup amount: $topupAmount');
      debugPrint('[SaveDraft] Draft data: ${json.encode(draft)}');
      
      await prefs.setString(draftKey, json.encode(draft));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${widget.selectedTagihan.length} tagihan${_includeTopup ? " + top-up" : ""} disimpan ke draft'
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error menyimpan draft: $e')),
        );
      }
    }
  }

  void _proceedToUpload() {
    if (_selectedBank == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih rekening tujuan terlebih dahulu')),
      );
      return;
    }

    final topupAmount = _includeTopup
        ? (double.tryParse(
                _topupController.text.replaceAll('.', '').replaceAll(',', '')) ??
            0.0)
        : 0.0;

    // Navigate to a screen that handles multiple tagihan in ONE payment
    // Extract tagihan IDs for bulk payment
    final tagihanIds = widget.selectedTagihan
        .map((t) => t['id'] as int?)
        .where((id) => id != null)
        .cast<int>()
        .toList();

    if (tagihanIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak ada tagihan valid')),
      );
      return;
    }

    // Navigate to upload screen - will handle multiple payment at once
    Navigator.pushNamed(
      context,
      '/unified-payment',
      arguments: {
        'tagihanIds': tagihanIds,
        'isMultiplePayment': true,
        'selectedTagihan': widget.selectedTagihan,
        'totalNominal': _calculateTotal(),
        'topupNominal': topupAmount,
        'includeTopup': _includeTopup,
        'selectedBankId': _selectedBank!.id,
      },
    ).then((result) {
      if (result == true && mounted) {
        Navigator.pop(context, true);
      }
    });
  }

  void _showContinueDialog() {
    // No longer needed - we pay all at once
  }

  @override
  Widget build(BuildContext context) {
    final total = _calculateTotal();

    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Informasi Pembayaran'),
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.selectedTagihan.length} Tagihan Dipilih'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // List of selected tagihan
              const Text(
                'Daftar Tagihan',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              
              ...widget.selectedTagihan.map((tagihan) {
                final sisa = double.tryParse(tagihan['sisa']?.toString() ?? '0') ?? 0;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tagihan['jenis_tagihan'] ?? 'Tagihan',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (tagihan['bulan'] != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            '${tagihan['bulan']} ${tagihan['tahun']}',
                            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                          ),
                        ],
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Sisa Tagihan'),
                            Text(
                              'Rp ${_formatCurrency(sisa)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 24),

              // Option to add topup
              CheckboxListTile(
                value: _includeTopup,
                onChanged: (val) => setState(() => _includeTopup = val ?? false),
                title: const Text(
                  'Sekaligus top-up dompet',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
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
                  onChanged: (_) => setState(() {}), // Rebuild untuk update total
                ),
                const SizedBox(height: 8),
                Text(
                  'Rp ${_formatCurrency(double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Total amount
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade700, Colors.blue.shade900],
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
                    if (_includeTopup) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Termasuk Top-up: Rp ${_formatCurrency(double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0)}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Bank selection
              const Text(
                'Transfer ke Rekening',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
                        color: isSelected ? Colors.blue : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: isSelected ? Colors.blue.shade50 : Colors.white,
                    ),
                    child: Row(
                      children: [
                        Radio<int>(
                          value: bank.id,
                          groupValue: _selectedBank?.id,
                          onChanged: (val) => setState(() => _selectedBank = bank),
                          activeColor: Colors.blue,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                bank.bankName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      bank.accountNumber,
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.copy, size: 18),
                                    onPressed: () {
                                      Clipboard.setData(
                                        ClipboardData(text: bank.accountNumber),
                                      );
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Nomor rekening disalin'),
                                          duration: Duration(seconds: 1),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
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
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 24),

              // Warning box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber, color: Colors.orange.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'PENTING',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '• Transfer TEPAT sesuai nominal di atas\n'
                      '• Simpan bukti transfer (screenshot/foto struk)\n'
                      '• Upload bukti setelah transfer berhasil\n'
                      '• Tunggu konfirmasi dari admin',
                      style: TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 100), // Space for bottom buttons
            ],
          ),
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
                onPressed: _saveToDraft,
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
                onPressed: _proceedToUpload,
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
}
