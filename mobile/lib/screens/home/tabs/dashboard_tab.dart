import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/widgets/common/tabungan_card.dart';
import 'package:simpels_mobile/widgets/common/dashboard_announcement_card.dart';
import 'package:simpels_mobile/widgets/common/notification_bell_widget.dart';
import 'package:simpels_mobile/screens/wallet/wallet_history_screen.dart';
import 'package:simpels_mobile/screens/tagihan/data_santri_screen.dart';
import 'package:simpels_mobile/screens/tabungan/tabungan_screen.dart';
import 'package:simpels_mobile/screens/bukti/bukti_history_screen.dart';
import 'package:simpels_mobile/screens/home/home_screen.dart';

class DashboardTab extends StatelessWidget {
  final Function(int)? onNavigateToTab;

  const DashboardTab({super.key, this.onNavigateToTab});

  void _showSantriSelector(BuildContext context, AuthProvider authProvider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Pilih Santri',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
            ),
            const Divider(height: 1),
            ListView.builder(
              shrinkWrap: true,
              itemCount: authProvider.santriList.length,
              itemBuilder: (context, index) {
                final santri = authProvider.santriList[index];
                final isActive = santri.id == authProvider.activeSantri?.id;

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor:
                        Theme.of(context).colorScheme.primary.withAlpha(51),
                    backgroundImage:
                        santri.fotoUrl != null && santri.fotoUrl!.isNotEmpty
                            ? NetworkImage(santri.fotoUrl!)
                            : null,
                    child: santri.fotoUrl == null || santri.fotoUrl!.isEmpty
                        ? Icon(
                            santri.jenisKelamin == 'L' ? Icons.boy : Icons.girl,
                            color: Theme.of(context).colorScheme.primary,
                          )
                        : null,
                  ),
                  title: Text(
                    santri.nama,
                    style: TextStyle(
                      fontWeight:
                          isActive ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                      'NIS: ${santri.nis} • ${santri.kelas ?? 'Belum ada kelas'}'),
                  trailing: isActive
                      ? Icon(Icons.check_circle,
                          color: Theme.of(context).colorScheme.primary)
                      : const Icon(Icons.chevron_right),
                  onTap: isActive
                      ? null
                      : () async {
                          Navigator.pop(context);

                          // Switch santri (instant, no loading needed)
                          await authProvider.switchSantri(santri.id);

                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Beralih ke akun ${santri.nama}'),
                                duration: const Duration(seconds: 1),
                              ),
                            );
                          }
                        },
                );
              },
            ),
            const SizedBox(height: 16),
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
          // Notification Bell dengan Badge
          NotificationBellWidget(santriId: santri?.id ?? ''),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await authProvider.refreshData();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Data berhasil diperbarui'),
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
            tooltip: 'Refresh Data',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await authProvider.refreshData();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Santri Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                ),
                child: Column(
                  children: [
                    // Photo Profile
                    Builder(
                      builder: (context) {
                        final currentSantri = santri;
                        final hasFoto = currentSantri?.fotoUrl != null &&
                            currentSantri!.fotoUrl!.isNotEmpty;

                        if (hasFoto) {
                          if (kDebugMode) {
                            debugPrint(
                                '[HomeScreen] Loading foto from: ${currentSantri.fotoUrl}');
                          }
                        } else {
                          if (kDebugMode) {
                            debugPrint(
                                '[HomeScreen] No foto URL available for ${currentSantri?.nama}');
                          }
                        }

                        return CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.white,
                          backgroundImage: hasFoto
                              ? NetworkImage(currentSantri.fotoUrl!)
                              : null,
                          onBackgroundImageError: hasFoto
                              ? (exception, stackTrace) {
                                  debugPrint(
                                      '[HomeScreen] Error loading foto from ${currentSantri.fotoUrl}');
                                  debugPrint('[HomeScreen] Error: $exception');
                                  debugPrint(
                                      '[HomeScreen] StackTrace: $stackTrace');
                                }
                              : null,
                          child: !hasFoto
                              ? Icon(
                                  currentSantri?.jenisKelamin == 'L'
                                      ? Icons.boy
                                      : Icons.girl,
                                  size: 50,
                                  color: Theme.of(context).colorScheme.primary,
                                )
                              : null,
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    // Nama Santri with Dropdown (if multiple santri)
                    authProvider.santriList.length > 1
                        ? InkWell(
                            onTap: () =>
                                _showSantriSelector(context, authProvider),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(26),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    santri?.nama ?? 'Nama Santri',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.keyboard_arrow_down,
                                      color: Colors.white, size: 28),
                                ],
                              ),
                            ),
                          )
                        : Text(
                            santri?.nama ?? 'Nama Santri',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                    const SizedBox(height: 8),
                    // Info Santri
                    Text(
                      'NIS: ${santri?.nis ?? '-'} • ${santri?.kelas ?? 'Belum ada kelas'}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withAlpha(230),
                      ),
                    ),
                    if (santri?.asrama != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Asrama: ${santri!.asrama}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withAlpha(230),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Saldo Dompet Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    if (santri != null && santri.id.isNotEmpty) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => WalletHistoryScreen(
                              santriId: santri.id, santriName: santri.nama),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Pilih santri terlebih dahulu')));
                    }
                  },
                  child: Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: (santri?.isBelowMinimum ?? false)
                              ? [
                                  Colors.red.shade400,
                                  Colors.red.shade600,
                                ]
                              : [
                                  Colors.green.shade400,
                                  Colors.green.shade600,
                                ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.account_balance_wallet,
                                color: Colors.white.withAlpha(230),
                                size: 24,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  'Saldo Dompet',
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.white.withAlpha(230),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Rp ${_formatCurrency(santri?.saldoDompet ?? 0)}',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(51),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.trending_up,
                                  size: 16,
                                  color: Colors.white.withAlpha(230),
                                ),
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    'Limit Harian: Rp ${_formatCurrency(santri?.limitHarian ?? 15000)}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white.withAlpha(230),
                                      fontWeight: FontWeight.w500,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_ios,
                                  size: 12,
                                  color: Colors.white.withAlpha(230),
                                ),
                              ],
                            ),
                          ),
                          if (santri?.isBelowMinimum ?? false) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(51),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.warning_amber_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Saldo di bawah minimum (Rp ${_formatCurrency(santri?.minimumBalance ?? 10000)}). Segera top-up!',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Saldo Tabungan Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TabunganCard(santri: santri),
              ),

              const SizedBox(height: 24),

              // Menu Cepat - Responsive layout with Show All feature
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _QuickMenuGrid(
                  onNavigateToTab: onNavigateToTab,
                ),
              ),

              const SizedBox(height: 24),

              // Pengumuman Section
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

class _QuickMenuGrid extends StatefulWidget {
  final Function(int)? onNavigateToTab;

  const _QuickMenuGrid({this.onNavigateToTab});

  @override
  State<_QuickMenuGrid> createState() => _QuickMenuGridState();
}

class _QuickMenuGridState extends State<_QuickMenuGrid> {
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
      setState(() {
        _loading = false;
        _hasTabungan = false;
      });
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
      setState(() {
        _hasTabungan = false;
        _loading = false;
      });
    }
  }

  List<Widget> _buildAllMenuItems() {
    final items = <Widget>[];

    // Data Santri
    items.add(_buildQuickMenu(
      context,
      icon: Icons.school,
      title: 'Data Santri',
      color: Colors.teal,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const DataSantriScreen(),
          ),
        );
      },
    ));

    // Dompet
    items.add(_buildQuickMenu(
      context,
      icon: Icons.account_balance_wallet,
      title: 'Dompet',
      color: Colors.blue,
      onTap: () {
        final santri =
            Provider.of<AuthProvider>(context, listen: false).activeSantri;
        if (santri != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => WalletHistoryScreen(
                santriId: santri.id,
                santriName: santri.nama,
              ),
            ),
          );
        }
      },
    ));

    // Tabungan (conditional)
    if (_hasTabungan) {
      items.add(_buildQuickMenu(
        context,
        icon: Icons.account_balance,
        title: 'Tabungan',
        color: Colors.indigo,
        onTap: () {
          final authProvider =
              Provider.of<AuthProvider>(context, listen: false);
          final santri = authProvider.activeSantri;
          if (santri != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TabunganScreen(
                  santriId: santri.id,
                  santriName: santri.nama,
                ),
              ),
            );
          }
        },
      ));
    }

    // Bayar
    items.add(_buildQuickMenu(
      context,
      icon: Icons.payment,
      title: 'Bayar',
      color: Colors.green,
      onTap: () {
        final homeScreen =
            context.findAncestorWidgetOfExactType<HomeScreen>();
        if (widget.onNavigateToTab != null) {
          widget.onNavigateToTab!(1);
        } else if (homeScreen?.key == HomeScreen.homeKey) {
          HomeScreen.navigateToTab(1);
        } else {
          // Navigation fallback
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => const HomeScreen(initialIndex: 1),
            ),
          );
        }
      },
    ));

    // Bukti Transfer
    items.add(_buildQuickMenu(
      context,
      icon: Icons.receipt_long,
      title: 'Bukti TF',
      color: Colors.orange,
      onTap: () {
        final santri =
            Provider.of<AuthProvider>(context, listen: false).activeSantri;
        if (santri != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => BuktiHistoryScreen(
                santriId: santri.id,
                santriName: santri.nama,
              ),
            ),
          );
        }
      },
    ));

    // Riwayat
    items.add(_buildQuickMenu(
      context,
      icon: Icons.history,
      title: 'Riwayat',
      color: Colors.purple,
      onTap: () {
        final homeScreen =
            context.findAncestorWidgetOfExactType<HomeScreen>();
        if (widget.onNavigateToTab != null) {
          widget.onNavigateToTab!(2);
        } else if (homeScreen?.key == HomeScreen.homeKey) {
          HomeScreen.navigateToTab(2);
        } else {
          // Navigation fallback
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => const HomeScreen(initialIndex: 2),
            ),
          );
        }
      },
    ));

    return items;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 100,
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    final allItems = _buildAllMenuItems();
    final itemsToShow = _showAll ? allItems : allItems.take(4).toList();
    final hasMore = allItems.length > 4;

    return Column(
      children: [
        // Main grid - always show 4 items per row
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
            if (index < itemsToShow.length) {
              return itemsToShow[index];
            } else if (hasMore && !_showAll) {
              // Show "Lihat Semua" button
              return _buildShowAllMenu();
            }
            return const SizedBox.shrink();
          },
        ),
        if (_showAll && hasMore) ...[
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _showAll = false;
              });
            },
            icon: const Icon(Icons.keyboard_arrow_up),
            label: const Text('Tampilkan Lebih Sedikit'),
            style: TextButton.styleFrom(
              foregroundColor: Colors.grey[600],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildShowAllMenu() {
    return InkWell(
      onTap: () {
        setState(() {
          _showAll = true;
        });
      },
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
            Icon(
              Icons.apps,
              size: 30,
              color: Colors.grey.shade600,
            ),
            const SizedBox(height: 8),
            Text(
              'Semua',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickMenu(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withAlpha(26),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 30, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
