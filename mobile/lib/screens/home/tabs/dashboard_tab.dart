import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/widgets/common/tabungan_card.dart';
import 'package:simpels_mobile/widgets/common/dashboard_announcement_card.dart';
import 'package:simpels_mobile/widgets/common/notification_bell_widget.dart';
import 'package:simpels_mobile/widgets/dashboard/profile_header.dart';
import 'package:simpels_mobile/widgets/dashboard/wallet_balance_card.dart';
import 'package:simpels_mobile/widgets/dashboard/quick_menu_grid.dart';
import 'package:simpels_mobile/screens/wallet/wallet_history_screen.dart';

class DashboardTab extends StatelessWidget {
  final Function(int)? onNavigateToTab;

  const DashboardTab({super.key, this.onNavigateToTab});

  void _showSantriSelector(BuildContext context, AuthProvider authProvider) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Pilih Santri', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            ...authProvider.santriList.map((santri) => ListTile(
              leading: const Icon(Icons.person),
              title: Text(santri.nama),
              subtitle: Text('NIS: ${santri.nis}'),
              selected: authProvider.activeSantri?.id == santri.id,
              onTap: () {
                authProvider.switchSantri(santri.id);
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final santri = authProvider.activeSantri;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Dashboard'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          NotificationBellWidget(santriId: santri?.id ?? ''),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await authProvider.refreshData();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Data berhasil diperbarui'), duration: Duration(seconds: 2)),
                );
              }
            },
            tooltip: 'Refresh Data',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => authProvider.refreshData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ProfileHeader(
                onTapSelector: () => _showSantriSelector(context, authProvider),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: WalletBalanceCard(
                  santri: santri,
                  onTap: () {
                    if (santri != null && santri.id.isNotEmpty) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => WalletHistoryScreen(santriId: santri.id, santriName: santri.nama),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Pilih santri terlebih dahulu')),
                      );
                    }
                  },
                  formatCurrency: _formatCurrency,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TabunganCard(santri: santri),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: QuickMenuGrid(onNavigateToTab: onNavigateToTab),
              ),
              const SizedBox(height: 24),
              const DashboardAnnouncementCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}
