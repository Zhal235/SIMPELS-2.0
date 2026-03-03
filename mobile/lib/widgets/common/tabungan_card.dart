import 'package:flutter/material.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/screens/tabungan/tabungan_screen.dart';

class TabunganCard extends StatefulWidget {
  final dynamic santri; // SantriModel or null

  const TabunganCard({super.key, this.santri});

  @override
  State<TabunganCard> createState() => _TabunganCardState();
}

class _TabunganCardState extends State<TabunganCard> {
  bool _loading = true;
  bool _hasTabungan = false;
  double _saldo = 0;
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(TabunganCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.santri?.id != widget.santri?.id) _load();
  }

  Future<void> _load() async {
    if (widget.santri == null) {
      setState(() {
        _loading = false;
        _hasTabungan = false;
      });
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await _api.getTabunganInfo(widget.santri!.id);
      if (res.statusCode == 200 && res.data['success'] == true) {
        _hasTabungan = true;
        _saldo = double.tryParse(res.data['data']['saldo'].toString()) ?? 0;
      } else {
        _hasTabungan = false;
      }
    } catch (_) {
      _hasTabungan = false;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(double v) => v.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]}.',
      );

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        height: 64,
        decoration: BoxDecoration(
          color: Colors.teal.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.teal.shade100),
        ),
        child: const Center(
            child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2))),
      );
    }
    if (!_hasTabungan) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {
        if (widget.santri != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => TabunganScreen(
                santriId: widget.santri!.id,
                santriName: widget.santri!.nama,
              ),
            ),
          ).then((_) => _load());
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.teal.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.teal.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.teal.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.account_balance_wallet,
                  color: Colors.teal.shade700, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Saldo Tabungan',
                      style:
                          TextStyle(fontSize: 12, color: Colors.teal.shade600)),
                  Text('Rp ${_fmt(_saldo)}',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.teal.shade800)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios,
                size: 14, color: Colors.teal.shade400),
          ],
        ),
      ),
    );
  }
}
