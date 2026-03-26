import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/screens/wallet/wallet_history_screen.dart';
import 'package:simpels_mobile/screens/tagihan/data_santri_screen.dart';
import 'package:simpels_mobile/screens/tabungan/tabungan_screen.dart';
import 'package:simpels_mobile/screens/bukti/bukti_history_screen.dart';
import 'package:simpels_mobile/screens/kebutuhan/kebutuhan_screen.dart';
import 'package:simpels_mobile/screens/home/home_screen.dart';

class QuickMenuGrid extends StatefulWidget {
  final Function(int)? onNavigateToTab;

  const QuickMenuGrid({super.key, this.onNavigateToTab});

  @override
  State<QuickMenuGrid> createState() => _QuickMenuGridState();
}

class _QuickMenuGridState extends State<QuickMenuGrid> {
  bool _showAll = false;
  bool _loading = true;
  bool _hasTabungan = false;
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _checkTabunganStatus();
  }

  Future<void> _checkTabunganStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santri = authProvider.activeSantri;

    if (santri == null) {
      setState(() { _loading = false; _hasTabungan = false; });
      return;
    }

    setState(() => _loading = true);
    try {
      final res = await _api.getTabunganInfo(santri.id);
      setState(() {
        _hasTabungan = res.statusCode == 200 && res.data['success'] == true;
        _loading = false;
      });
    } catch (_) {
      setState(() { _hasTabungan = false; _loading = false; });
    }
  }

  List<Widget> _buildAllMenuItems() {
    final items = <Widget>[];

    items.add(_buildQuickMenu(context, icon: Icons.school, title: 'Data Santri', color: Colors.teal, onTap: () {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const DataSantriScreen()));
    }));

    items.add(_buildQuickMenu(context, icon: Icons.account_balance_wallet, title: 'Dompet', color: Colors.blue, onTap: () {
      final santri = Provider.of<AuthProvider>(context, listen: false).activeSantri;
      if (santri != null) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => WalletHistoryScreen(santriId: santri.id, santriName: santri.nama)));
      }
    }));

    items.add(_buildQuickMenu(context,
        icon: Icons.shopping_bag_outlined,
        title: 'Kebutuhan',
        color: const Color(0xFF0D9488),
        onTap: () {
          final santri =
              Provider.of<AuthProvider>(context, listen: false).activeSantri;
          if (santri != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => KebutuhanScreen(
                    santriId: santri.id, santriName: santri.nama),
              ),
            );
          }
        }));

    items.add(_buildQuickMenu(context, icon: Icons.payment, title: 'Bayar', color: Colors.green, onTap: () {
      if (widget.onNavigateToTab != null) {
        widget.onNavigateToTab!(1);
      } else if (HomeScreen.homeKey.currentState != null) {
        HomeScreen.navigateToTab(1);
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen(initialIndex: 1)));
      }
    }));

    items.add(_buildQuickMenu(context, icon: Icons.receipt_long, title: 'Bukti TF', color: Colors.orange, onTap: () {
      final santri = Provider.of<AuthProvider>(context, listen: false).activeSantri;
      if (santri != null) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => BuktiHistoryScreen(santriId: santri.id, santriName: santri.nama)));
      }
    }));

    items.add(_buildQuickMenu(context, icon: Icons.history, title: 'Riwayat', color: Colors.purple, onTap: () {
      if (widget.onNavigateToTab != null) {
        widget.onNavigateToTab!(2);
      } else if (HomeScreen.homeKey.currentState != null) {
        HomeScreen.navigateToTab(2);
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen(initialIndex: 2)));
      }
    }));

    if (_hasTabungan) {
      items.add(_buildQuickMenu(context, icon: Icons.account_balance, title: 'Tabungan', color: Colors.indigo, onTap: () {
        final santri = Provider.of<AuthProvider>(context, listen: false).activeSantri;
        if (santri != null) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => TabunganScreen(santriId: santri.id, santriName: santri.nama)));
        }
      }));
    }

    return items;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 100,
        child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
      );
    }

    final allItems = _buildAllMenuItems();
    final itemsToShow = _showAll ? allItems : allItems.take(4).toList();
    final hasMore = allItems.length > 4;

    return Column(
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            childAspectRatio: 1.0,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: itemsToShow.length + (hasMore && !_showAll ? 1 : 0),
          itemBuilder: (context, index) {
            if (index < itemsToShow.length) return itemsToShow[index];
            if (hasMore && !_showAll) return _buildShowAllMenu();
            return const SizedBox.shrink();
          },
        ),
        if (_showAll && hasMore) ...[
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => setState(() => _showAll = false),
            icon: const Icon(Icons.keyboard_arrow_up),
            label: const Text('Tampilkan Lebih Sedikit'),
            style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
          ),
        ],
      ],
    );
  }

  Widget _buildShowAllMenu() {
    return InkWell(
      onTap: () => setState(() => _showAll = true),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.apps, size: 30, color: Colors.grey.shade600),
            const SizedBox(height: 8),
            Text('Semua', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickMenu(BuildContext context, {required IconData icon, required String title, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(color: color.withAlpha(26), borderRadius: BorderRadius.circular(12)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 30, color: color),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
