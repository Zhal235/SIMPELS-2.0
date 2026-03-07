import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/models/bank_account.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/widgets/payment/bank_selector.dart';
import 'package:simpels_mobile/widgets/payment/total_amount_card.dart';

class MultiplePaymentInfoScreen extends StatefulWidget {
  final List<Map<String, dynamic>> selectedTagihan;

  const MultiplePaymentInfoScreen({super.key, required this.selectedTagihan});

  @override
  State<MultiplePaymentInfoScreen> createState() => _MultiplePaymentInfoScreenState();
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
      final response = await ApiService().getBankAccounts();
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        setState(() {
          _bankAccounts = data.map((json) => BankAccount.fromJson(json)).toList();
          if (_bankAccounts.isNotEmpty) _selectedBank = _bankAccounts.first;
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error memuat data rekening: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatCurrency(double amount) => amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');

  double _calculateTotal() {
    double total = widget.selectedTagihan.fold(0, (sum, t) => sum + (double.tryParse(t['sisa']?.toString() ?? '0') ?? 0));
    if (_includeTopup) total += double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0;
    return total;
  }

  Future<void> _saveToDraft() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santriId = authProvider.activeSantri?.id;
      if (santriId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Santri tidak ditemukan')));
        return;
      }
      final topupAmount = _includeTopup ? (double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0.0) : 0.0;
      final draft = {
        'isMultiple': true, 'tagihan': widget.selectedTagihan, 'topupAmount': topupAmount,
        'includeTopup': _includeTopup, 'timestamp': DateTime.now().toIso8601String(),
        'selectedBankId': _selectedBank?.id, 'totalPayment': _calculateTotal(),
      };
      final prefs = await SharedPreferences.getInstance();
      final key = 'payment_draft_multiple_${santriId}_${DateTime.now().millisecondsSinceEpoch}';
      await prefs.setString(key, json.encode(draft));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('${widget.selectedTagihan.length} tagihan${_includeTopup ? " + top-up" : ""} disimpan ke draft'),
          backgroundColor: Colors.green,
        ));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error menyimpan draft: $e')));
    }
  }

  void _proceedToUpload() {
    if (_selectedBank == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih rekening tujuan terlebih dahulu')));
      return;
    }
    final tagihanIds = widget.selectedTagihan.map((t) => t['id'] as int?).whereType<int>().toList();
    if (tagihanIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak ada tagihan valid')));
      return;
    }
    final topupAmount = _includeTopup ? (double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0.0) : 0.0;
    Navigator.pushNamed(context, '/unified-payment', arguments: {
      'tagihanIds': tagihanIds, 'isMultiplePayment': true, 'selectedTagihan': widget.selectedTagihan,
      'totalNominal': _calculateTotal(), 'topupNominal': topupAmount,
      'includeTopup': _includeTopup, 'selectedBankId': _selectedBank!.id,
    }).then((result) { if (result == true && mounted) Navigator.pop(context, true); });
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nomor rekening disalin'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Informasi Pembayaran'), backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final total = _calculateTotal();

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.selectedTagihan.length} Tagihan Dipilih'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Daftar Tagihan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...widget.selectedTagihan.map((tagihan) => _TagihanCard(tagihan: tagihan, formatCurrency: _formatCurrency)),
            const SizedBox(height: 24),
            CheckboxListTile(
              value: _includeTopup,
              onChanged: (val) => setState(() => _includeTopup = val ?? false),
              title: const Text('Sekaligus top-up dompet', style: TextStyle(fontWeight: FontWeight.w600)),
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
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  prefixText: 'Rp ', filled: true, fillColor: Colors.white,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),
              Text(
                'Rp ${_formatCurrency(double.tryParse(_topupController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0)}',
                style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic),
              ),
            ],
            const SizedBox(height: 24),
            TotalAmountCard(total: total, formatCurrency: _formatCurrency),
            const SizedBox(height: 24),
            BankSelector(bankAccounts: _bankAccounts, selectedBank: _selectedBank, onSelect: (b) => setState(() => _selectedBank = b), onCopy: _copyToClipboard),
            const SizedBox(height: 24),
            _buildImportantNote(),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildImportantNote() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(Icons.warning_amber, color: Colors.orange.shade700),
            const SizedBox(width: 8),
            const Text('PENTING', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ]),
          const SizedBox(height: 8),
          const Text(
            '- Transfer TEPAT sesuai nominal di atas\n- Simpan bukti transfer (screenshot/foto struk)\n- Upload bukti setelah transfer berhasil\n- Tunggu konfirmasi dari admin',
            style: TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, -2))]),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _saveToDraft,
              icon: const Icon(Icons.save_outlined),
              label: const Text('Simpan Draft'),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), side: BorderSide(color: Colors.blue.shade700), foregroundColor: Colors.blue.shade700),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: _proceedToUpload,
              icon: const Icon(Icons.upload_file),
              label: const Text('Upload Bukti Transfer'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _TagihanCard extends StatelessWidget {
  final Map<String, dynamic> tagihan;
  final String Function(double) formatCurrency;

  const _TagihanCard({required this.tagihan, required this.formatCurrency});

  @override
  Widget build(BuildContext context) {
    final sisa = double.tryParse(tagihan['sisa']?.toString() ?? '0') ?? 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tagihan['jenis_tagihan'] ?? 'Tagihan', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            if (tagihan['bulan'] != null) ...[
              const SizedBox(height: 8),
              Text('${tagihan['bulan']} ${tagihan['tahun']}', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
            ],
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Sisa Tagihan'),
                Text('Rp ${formatCurrency(sisa)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
