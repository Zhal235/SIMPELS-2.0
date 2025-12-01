import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/wallet_transaction.dart';

class WalletFullHistoryScreen extends StatefulWidget {
  final String santriId;
  final String santriName;

  const WalletFullHistoryScreen(
      {super.key, required this.santriId, required this.santriName});

  @override
  State<WalletFullHistoryScreen> createState() =>
      _WalletFullHistoryScreenState();
}

class _WalletFullHistoryScreenState extends State<WalletFullHistoryScreen> {
  final ApiService _api = ApiService();
  bool _loading = true;
  List<WalletTransaction> _items = [];
  String _filterType = 'all';

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getWalletTransactions(widget.santriId,
          page: 1, limit: 200);
      if (res.statusCode == 200 && res.data['success'] == true) {
        final data = res.data['data'] as List<dynamic>;
        setState(() {
          _items = data
              .map((d) =>
                  WalletTransaction.fromJson(Map<String, dynamic>.from(d)))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Load full history error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<WalletTransaction> get _filteredItems {
    if (_filterType == 'all') return _items;
    return _items.where((i) => i.tipe == _filterType).toList();
  }

  String _formatCurrency(num amount) =>
      amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Riwayat Dompet — ${widget.santriName}'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Text('Filter:'),
                        const SizedBox(width: 8),
                        DropdownButton<String>(
                          value: _filterType,
                          items: const [
                            DropdownMenuItem(
                                value: 'all', child: Text('Semua')),
                            DropdownMenuItem(
                                value: 'credit',
                                child: Text('Top-up / Kredit')),
                            DropdownMenuItem(
                                value: 'debit',
                                child: Text('Pembayaran / Debit')),
                          ],
                          onChanged: (v) {
                            if (v == null) return;
                            setState(() => _filterType = v);
                          },
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _filteredItems.isEmpty
                        ? const Center(child: Text('Tidak ada transaksi'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _filteredItems.length,
                            itemBuilder: (context, idx) {
                              final txn = _filteredItems[idx];
                              final isCredit = txn.tipe == 'credit';
                              // Format tanggal: 30/11/2025, 11:41
                              final formattedDate =
                                  '${txn.tanggal.day.toString().padLeft(2, '0')}/${txn.tanggal.month.toString().padLeft(2, '0')}/${txn.tanggal.year}, ${txn.tanggal.hour.toString().padLeft(2, '0')}:${txn.tanggal.minute.toString().padLeft(2, '0')}';

                              return Card(
                                margin: const EdgeInsets.symmetric(vertical: 6),
                                child: ListTile(
                                  title: Text(txn.keterangan.isNotEmpty
                                      ? txn.keterangan
                                      : (isCredit ? 'Top-up' : 'Pembayaran')),
                                  subtitle: Text(formattedDate),
                                  trailing: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                          '${isCredit ? '+' : '-'} Rp ${_formatCurrency(txn.jumlah)}',
                                          style: TextStyle(
                                              color: isCredit
                                                  ? Colors.green
                                                  : Colors.red,
                                              fontWeight: FontWeight.bold)),
                                      Text(
                                          'Saldo: Rp ${_formatCurrency(txn.saldoAkhir)}',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey)),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}
