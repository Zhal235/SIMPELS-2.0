import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TabunganScreen extends StatefulWidget {
  final String santriId;
  final String santriName;

  const TabunganScreen({
    super.key,
    required this.santriId,
    required this.santriName,
  });

  @override
  State<TabunganScreen> createState() => _TabunganScreenState();
}

class _TabunganScreenState extends State<TabunganScreen> {
  bool _loading = true;
  bool _hasTabungan = false;
  Map<String, dynamic>? _tabunganData;
  List<Map<String, dynamic>> _transactions = [];
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final tabRes = await _api.getTabunganInfo(widget.santriId);
      if (tabRes.statusCode == 200 && tabRes.data['success'] == true) {
        _hasTabungan = true;
        _tabunganData = Map<String, dynamic>.from(tabRes.data['data'] ?? {});

        final histRes = await _api.getTabunganHistory(widget.santriId);
        if (histRes.statusCode == 200 && histRes.data['success'] == true) {
          final raw = histRes.data['data'] as List? ?? [];
          _transactions = raw.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } else {
        _hasTabungan = false;
      }
    } catch (_) {
      _hasTabungan = false;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatCurrency(dynamic amount) {
    final value = double.tryParse(amount.toString()) ?? 0;
    final formatted = value.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return formatted;
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tabungan — ${widget.santriName}'),
        backgroundColor: Colors.teal.shade600,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : !_hasTabungan
              ? _buildNoTabungan()
              : _buildContent(),
    );
  }

  Widget _buildNoTabungan() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.savings_outlined, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Belum memiliki tabungan',
            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Text(
            'Hubungi admin pondok untuk membuka tabungan',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final saldo = _tabunganData?['saldo'] ?? 0;
    final status = _tabunganData?['status'] ?? 'aktif';
    final openedAt = _tabunganData?['opened_at'];

    final totalSetor = _transactions
        .where((t) => t['type'] == 'setor')
        .fold<double>(0, (s, t) => s + (double.tryParse(t['amount'].toString()) ?? 0));
    final totalTarik = _transactions
        .where((t) => t['type'] == 'tarik')
        .fold<double>(0, (s, t) => s + (double.tryParse(t['amount'].toString()) ?? 0));

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            // Saldo card
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.teal.shade400, Colors.teal.shade700],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.teal.withAlpha(100),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.savings, color: Colors.white.withAlpha(230), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Saldo Tabungan',
                        style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 14),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: status == 'aktif'
                              ? Colors.green.withAlpha(80)
                              : Colors.red.withAlpha(80),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Rp ${_formatCurrency(saldo)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (openedAt != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Dibuka: ${_formatDate(openedAt)}',
                      style: TextStyle(color: Colors.white.withAlpha(180), fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),

            // Stats row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Total Setor',
                      value: 'Rp ${_formatCurrency(totalSetor)}',
                      icon: Icons.arrow_upward,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Total Tarik',
                      value: 'Rp ${_formatCurrency(totalTarik)}',
                      icon: Icons.arrow_downward,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Transactions
            if (_transactions.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Text(
                    'Belum ada transaksi tabungan',
                    style: TextStyle(color: Colors.grey.shade500),
                  ),
                ),
              )
            else ...[
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Riwayat Transaksi',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
              ),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _transactions.length,
                separatorBuilder: (_, __) => const Divider(height: 1, indent: 16, endIndent: 16),
                itemBuilder: (context, index) {
                  final t = _transactions[index];
                  final isSetor = t['type'] == 'setor';
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isSetor ? Colors.green.shade50 : Colors.orange.shade50,
                      child: Icon(
                        isSetor ? Icons.arrow_upward : Icons.arrow_downward,
                        color: isSetor ? Colors.green : Colors.orange,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      t['description'] ?? (isSetor ? 'Setoran tabungan' : 'Penarikan tabungan'),
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      '${_formatDate(t['created_at'])} · ${t['method'] ?? 'cash'}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${isSetor ? '+' : '-'}Rp ${_formatCurrency(t['amount'])}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isSetor ? Colors.green : Colors.orange,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Saldo: Rp ${_formatCurrency(t['saldo_after'])}',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 13)),
        ],
      ),
    );
  }
}
