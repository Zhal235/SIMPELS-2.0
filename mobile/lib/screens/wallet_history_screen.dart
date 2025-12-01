import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/wallet_transaction.dart';
import 'payment_info_screen.dart';
import 'bukti_history_screen.dart';

class WalletHistoryScreen extends StatefulWidget {
  final String santriId;
  final String santriName;

  const WalletHistoryScreen(
      {super.key, required this.santriId, required this.santriName});

  @override
  State<WalletHistoryScreen> createState() => _WalletHistoryScreenState();
}

class _WalletHistoryScreenState extends State<WalletHistoryScreen> {
  bool _loading = true;
  Map<String, dynamic>? _walletData;
  final ApiService _api = ApiService();

  Future<void> _loadWallet() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getWaliWallet(widget.santriId);
      if (res.statusCode == 200 && res.data['success'] == true) {
        setState(() =>
            _walletData = Map<String, dynamic>.from(res.data['data'] ?? {}));
      }
    } catch (e) {
      debugPrint('Load wallet error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error loading wallet: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  String _formatCurrency(dynamic amount) {
    // Safe parsing - handle both String and num from API
    double value = 0;
    if (amount is num) {
      value = amount.toDouble();
    } else if (amount is String) {
      value = double.tryParse(amount) ?? 0;
    }
    final v = value.toStringAsFixed(0);
    return v.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }

  Future<void> _showTopupDialog() async {
    final formKey = GlobalKey<FormState>();
    double? amount;

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Top-up Dompet'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Masukkan nominal yang akan di-top up. Anda akan diminta untuk upload bukti transfer.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Nominal (contoh: 50000)',
                  prefixText: 'Rp ',
                ),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Masukkan nominal';
                  final n = double.tryParse(v.replaceAll('.', ''));
                  if (n == null || n <= 0) return 'Nominal tidak valid';
                  if (n < 10000) return 'Minimal top-up Rp 10.000';
                  return null;
                },
                onSaved: (v) =>
                    amount = double.tryParse(v!.replaceAll('.', '')),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              formKey.currentState!.save();
              if (amount == null) return;
              Navigator.pop(context);

              // Navigate to payment info screen first untuk melihat rekening bank
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PaymentInfoScreen(
                    isTopupOnly: true,
                    topupNominal: amount!,
                    santriName: widget.santriName,
                  ),
                ),
              );

              // If upload successful, refresh wallet data
              if (result == true) {
                await _loadWallet();
                final authProvider =
                    Provider.of<AuthProvider>(context, listen: false);
                await authProvider.refreshData();
              }
            },
            child: const Text('Lanjutkan'),
          ),
        ],
      ),
    );
  }

  Future<void> _showEditLimitDialog() async {
    final formKey = GlobalKey<FormState>();
    // Parse limit_harian safely - could be String or num from API
    final limitValue = _walletData?['limit_harian'];
    double current = 0;
    if (limitValue != null) {
      if (limitValue is num) {
        current = limitValue.toDouble();
      } else if (limitValue is String) {
        current = double.tryParse(limitValue) ?? 0;
      }
    }
    double? newVal;

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Ubah Limit Harian'),
        content: Form(
          key: formKey,
          child: TextFormField(
            initialValue: current.toStringAsFixed(0),
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Limit Harian (Rp)'),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Masukkan nilai';
              final n = double.tryParse(v.replaceAll('.', ''));
              if (n == null || n < 0) return 'Nilai tidak valid';
              return null;
            },
            onSaved: (v) => newVal = double.tryParse(v!.replaceAll('.', '')),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              formKey.currentState!.save();
              if (newVal == null) return;
              Navigator.pop(context);
              try {
                final res =
                    await _api.setSantriDailyLimit(widget.santriId, newVal!);
                if (res.statusCode == 200 && res.data['success'] == true) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Limit diperbarui')));
                  }
                  await _loadWallet();
                  await Provider.of<AuthProvider>(context, listen: false)
                      .refreshData();
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text('Gagal memperbarui limit: ${res.data}')));
                  }
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context)
                      .showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // activeSantri available via provider if needed for extra context

    return Scaffold(
      appBar: AppBar(
        title: Text('Riwayat Dompet — ${widget.santriName}'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.receipt_long),
            tooltip: 'Riwayat Bukti Transfer',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BuktiHistoryScreen(
                    santriId: widget.santriId,
                    santriName: widget.santriName,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadWallet,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Card(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Saldo Dompet',
                                          style: TextStyle(color: Colors.grey)),
                                      const SizedBox(height: 8),
                                      Text(
                                          'Rp ${_formatCurrency(_walletData?['saldo'] ?? 0)}',
                                          style: const TextStyle(
                                              fontSize: 26,
                                              fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                          'Limit Harian: Rp ${_formatCurrency(_walletData?['limit_harian'] ?? 0)}',
                                          style: const TextStyle(
                                              color: Colors.grey)),
                                      TextButton.icon(
                                          onPressed: _showEditLimitDialog,
                                          icon: const Icon(Icons.edit),
                                          label: const Text('Ubah')),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  ElevatedButton.icon(
                                      onPressed: _showTopupDialog,
                                      icon: const Icon(Icons.add),
                                      label: const Text('Top-up')),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: () {
                                      Navigator.pushNamed(
                                          context, '/wallet-full-history',
                                          arguments: {
                                            'santriId': widget.santriId,
                                            'santriName': widget.santriName,
                                          });
                                    },
                                    icon: const Icon(Icons.list),
                                    label: const Text('Lihat Semua'),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text('Riwayat Terakhir',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if ((_walletData?['transaksi_terakhir'] ?? []).isEmpty)
                        const Center(
                            child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 32),
                                child: Text('Belum ada transaksi')))
                      else
                        ...(_walletData?['transaksi_terakhir'] ?? [])
                            .map<Widget>((t) {
                          final txn = WalletTransaction.fromJson(
                              Map<String, dynamic>.from(t));
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
                              trailing: Text(
                                  '${isCredit ? '+' : '-'} Rp ${_formatCurrency(txn.jumlah)}',
                                  style: TextStyle(
                                      color:
                                          isCredit ? Colors.green : Colors.red,
                                      fontWeight: FontWeight.bold)),
                            ),
                          );
                        }).toList(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
