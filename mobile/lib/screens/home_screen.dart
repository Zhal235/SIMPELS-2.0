import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
// models import removed because types aren't used in this file
import 'login_screen.dart';
import 'wallet_history_screen.dart';
import 'notification_screen.dart';
import 'unified_payment_screen.dart';
import 'bukti_history_screen.dart';
import 'data_santri_screen.dart';
import '../widgets/announcement_badge.dart';

class HomeScreen extends StatefulWidget {
  final int initialIndex;
  const HomeScreen({super.key, this.initialIndex = 0});

  // A global key is used by other screens to reliably access the HomeScreen state
  // (useful after hot-reload / hot-restart to ensure navigation targets the active instance)
  // Use a non-private generic type to avoid exposing private state in public API
  static final GlobalKey homeKey = GlobalKey();

  // Public helper so other widgets can request navigation without exposing
  // the private `_HomeScreenState` type in our public API.
  static void navigateToTab(int index) {
    final state = homeKey.currentState;
    if (state is _HomeScreenState) {
      state.navigateTo(index);
    }
  }

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _screens = [
      DashboardTab(onNavigateToTab: (index) {
        // debug: show navigation attempts
        debugPrint('HomeScreen: request navigate to tab $index');
        if (!mounted) return;
        setState(() {
          _selectedIndex = index;
        });
        debugPrint('HomeScreen: selectedIndex now $_selectedIndex');
      }),
      const PembayaranTab(),
      const RiwayatTab(),
      const ProfileTab(),
    ];
  }

  // Public navigation method so child widgets can request tab changes
  void navigateTo(int index) {
    if (!mounted) return;
    setState(() {
      _selectedIndex = index;
    });
    debugPrint('HomeScreen.navigateTo: selectedIndex=$_selectedIndex');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.payment),
            label: 'Pembayaran',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Riwayat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// Dashboard Tab
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
          // Announcement Badge
          const AnnouncementBadge(),
          // Notification Bell dengan Badge
          _NotificationBellWidget(santriId: santri?.id ?? ''),
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
                          debugPrint(
                              '[HomeScreen] Loading foto from: ${currentSantri.fotoUrl}');
                        } else {
                          debugPrint(
                              '[HomeScreen] No foto URL available for ${currentSantri?.nama}');
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
                          colors: [
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
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Menu Cepat
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildQuickMenu(
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
                    ),
                    _buildQuickMenu(
                      context,
                      icon: Icons.receipt_long,
                      title: 'Bukti TF',
                      color: Colors.orange,
                      onTap: () {
                        final santri =
                            Provider.of<AuthProvider>(context, listen: false)
                                .activeSantri;
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
                    ),
                    _buildQuickMenu(
                      context,
                      icon: Icons.history,
                      title: 'Riwayat',
                      color: Colors.purple,
                      onTap: () {
                        // Navigate to Riwayat tab (index 2)
                        debugPrint('QuickMenu: Riwayat tapped');
                        if (onNavigateToTab != null) {
                          onNavigateToTab!(2);
                        } else {
                          final homeState = context
                              .findAncestorStateOfType<_HomeScreenState>();
                          if (homeState != null) {
                            homeState.navigateTo(2);
                          } else if (HomeScreen.homeKey.currentState != null) {
                            HomeScreen.navigateToTab(2);
                          } else {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => HomeScreen(
                                      key: HomeScreen.homeKey,
                                      initialIndex: 2)),
                            );
                          }
                        }
                      },
                    ),
                    _buildQuickMenu(
                      context,
                      icon: Icons.account_balance_wallet,
                      title: 'Dompet',
                      color: Colors.blue,
                      onTap: () {
                        final santri =
                            Provider.of<AuthProvider>(context, listen: false)
                                .activeSantri;
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
                    ),
                    _buildQuickMenu(
                      context,
                      icon: Icons.payment,
                      title: 'Bayar',
                      color: Colors.green,
                      onTap: () {
                        debugPrint('QuickMenu: Bayar tapped');
                        if (onNavigateToTab != null) {
                          onNavigateToTab!(1);
                        } else {
                          final homeState = context
                              .findAncestorStateOfType<_HomeScreenState>();
                          if (homeState != null) {
                            homeState.navigateTo(1);
                          } else if (HomeScreen.homeKey.currentState != null) {
                            HomeScreen.navigateToTab(1);
                          } else {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => HomeScreen(
                                      key: HomeScreen.homeKey,
                                      initialIndex: 1)),
                            );
                          }
                        }
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withAlpha(26),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 30, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
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

// Pembayaran Tab
class PembayaranTab extends StatefulWidget {
  const PembayaranTab({super.key});

  @override
  State<PembayaranTab> createState() => _PembayaranTabState();
}

class _PembayaranTabState extends State<PembayaranTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  Map<String, dynamic>? _tagihanData;
  final Set<int> _selectedTagihanIds = {};
  bool _showFutureTagihan = false; // Toggle untuk menampilkan tagihan bulan depan
  // Selection mode is active when any tagihan is selected
  bool get _isSelectionMode => _selectedTagihanIds.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadTagihan();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _toggleSelection(int tagihanId) {
    setState(() {
      if (_selectedTagihanIds.contains(tagihanId)) {
        _selectedTagihanIds.remove(tagihanId);
      } else {
        _selectedTagihanIds.add(tagihanId);
      }
    });
  }

  double _calculateTotal() {
    if (_tagihanData == null) return 0;

    double total = 0;
    final allTagihan = _tagihanData!['data']?['semua'] ?? [];

    for (var tagihan in allTagihan) {
      if (_selectedTagihanIds.contains(tagihan['id'])) {
        final sisa = double.tryParse(tagihan['sisa'].toString()) ?? 0;
        total += sisa;
      }
    }
    return total;
  }

  List<Map<String, dynamic>> _getSelectedTagihan() {
    if (_tagihanData == null) return [];

    try {
      // Gabungkan semua tagihan dari semua kategori
      final List<dynamic> allTagihan = [];
      
      final data = _tagihanData!['data'];
      if (data != null && data is Map) {
        // Ambil dari semua kategori: semua, lunas, belum_bayar
        if (data['semua'] is List) {
          allTagihan.addAll(data['semua']);
        }
        if (data['lunas'] is List) {
          allTagihan.addAll(data['lunas']);
        }
        if (data['belum_bayar'] is List) {
          allTagihan.addAll(data['belum_bayar']);
        }
      }
      
      // Remove duplicates by ID
      final Map<int, Map<String, dynamic>> uniqueTagihan = {};
      for (var item in allTagihan) {
        if (item is Map) {
          final id = item['id'];
          if (id != null && !uniqueTagihan.containsKey(id)) {
            uniqueTagihan[id] = Map<String, dynamic>.from(item);
          }
        }
      }

      // Filter selected tagihan
      return uniqueTagihan.values
          .where((t) => _selectedTagihanIds.contains(t['id']))
          .toList();
    } catch (e) {
      debugPrint('Error in _getSelectedTagihan: $e');
      return [];
    }
  }

  Future<void> _loadTagihan() async {
    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;

    if (santriId == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final apiService = ApiService();
      final response = await apiService.getAllTagihan(santriId);

      if (response.statusCode == 200) {
        // Backend mengirim data yang sudah dikategorisasi
        final responseBody = response.data;
        debugPrint('[_loadTagihan] Response: ${responseBody.runtimeType}');

        if (responseBody is Map && responseBody['success'] == true) {
          setState(() {
            _tagihanData = Map<String, dynamic>.from(responseBody);
            _isLoading = false;
          });
          debugPrint('[_loadTagihan] Data loaded successfully');
        } else {
          throw Exception('Invalid response format');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error loading tagihan: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalSelected = _calculateTotal();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: _isSelectionMode
            ? Text('${_selectedTagihanIds.length} dipilih')
            : const Text('Pembayaran'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: _isSelectionMode
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _selectedTagihanIds.clear();
                  });
                },
              )
            : null,
        actions: _isSelectionMode
            ? null
            : [
                IconButton(
                  icon: Icon(_showFutureTagihan
                      ? Icons.visibility_off
                      : Icons.visibility),
                  onPressed: () {
                    setState(() {
                      _showFutureTagihan = !_showFutureTagihan;
                    });
                  },
                  tooltip: _showFutureTagihan
                      ? 'Sembunyikan tagihan bulan depan'
                      : 'Tampilkan tagihan bulan depan',
                ),
              ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Semua'),
            Tab(text: 'Lunas'),
            Tab(text: 'Belum Bayar'),
            Tab(text: 'Draft'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              key: ValueKey('tagihan_view_$_showFutureTagihan'),
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadTagihan,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildTagihanList(
                            _tagihanData?['data']?['semua'] ?? []),
                        _buildTagihanList(
                            _tagihanData?['data']?['lunas'] ?? []),
                        _buildTagihanList(
                            _tagihanData?['data']?['belum_bayar'] ?? []),
                        const _DraftPembayaranList(),
                      ],
                    ),
                  ),
                ),
                if (_isSelectionMode)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(26),
                          blurRadius: 8,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(16),
                    child: SafeArea(
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${_selectedTagihanIds.length} tagihan dipilih',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Rp ${totalSelected.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1976D2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: _selectedTagihanIds.isEmpty
                                ? null
                                : () {
                                    try {
                                      final selectedTagihan =
                                          _getSelectedTagihan();
                                      debugPrint(
                                          '[Bayar Button] Selected tagihan count: ${selectedTagihan.length}');
                                      debugPrint(
                                          '[Bayar Button] Total: $totalSelected');

                                      // Navigate to upload bukti screen
                                      // Pass flag to include topup, nominal akan diisi di screen berikutnya
                                      Navigator.pushNamed(
                                        context,
                                        '/upload-bukti',
                                        arguments: {
                                          'selectedTagihan': selectedTagihan,
                                          'totalNominal': totalSelected,
                                        },
                                      ).then((result) {
                                        if (result == true) {
                                          setState(() {
                                            _selectedTagihanIds.clear();
                                          });
                                          _loadTagihan();
                                        }
                                      });
                                    } catch (e) {
                                      debugPrint('[Bayar Button ERROR] $e');
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(content: Text('Error: $e')),
                                      );
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1976D2),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 32,
                                vertical: 16,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text(
                              'Bayar',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildTagihanList(List<dynamic> tagihan) {
    if (tagihan.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height - 300,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined,
                      size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Tidak ada data',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // Get current month and year
    final now = DateTime.now();
    final currentMonth = now.month;
    final currentYear = now.year;

    // Group tagihan by month-year and separate current/past from future
    Map<String, List<dynamic>> currentAndPastTagihan = {};
    Map<String, List<dynamic>> futureTagihan = {};
    
    for (var item in tagihan) {
      final bulan = item['bulan'];
      final tahun = item['tahun'];
      
      // Create key for grouping
      String key;
      if (bulan != null && bulan.toString().isNotEmpty) {
        if (tahun != null && tahun.toString().isNotEmpty) {
          key = '${bulan.toString()} ${tahun.toString()}';
        } else {
          key = bulan.toString();
        }
      } else {
        key = 'Tanpa Bulan';
      }
      
      // Determine if this is a future month
      bool isFuture = false;
      if (bulan != null && tahun != null) {
        final bulanStr = bulan.toString();
        final monthIndex = _getMonthIndex(bulanStr);
        if (monthIndex != -1) {
          final itemYear = int.tryParse(tahun.toString()) ?? currentYear;
          final itemMonth = monthIndex + 1;
          
          // Compare dates
          if (itemYear > currentYear || 
              (itemYear == currentYear && itemMonth > currentMonth)) {
            isFuture = true;
          }
        }
      }
      
      final targetMap = isFuture ? futureTagihan : currentAndPastTagihan;
      if (!targetMap.containsKey(key)) {
        targetMap[key] = [];
      }
      targetMap[key]!.add(item);
    }

    // Sort keys by month order (Juli -> Juni)
    final sortedCurrentKeys = _sortMonthKeys(currentAndPastTagihan.keys.toList());
    final sortedFutureKeys = _sortMonthKeys(futureTagihan.keys.toList());

    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        // Current and past months
        ...sortedCurrentKeys.map((monthKey) {
          final items = currentAndPastTagihan[monthKey]!;
          return _buildMonthGroup(monthKey, items, isFuture: false);
        }),
        
        // Future months section
        if (futureTagihan.isNotEmpty) ...[
          // Toggle button
          GestureDetector(
            onTap: () {
              debugPrint('[Toggle] Current state: $_showFutureTagihan');
              setState(() {
                _showFutureTagihan = !_showFutureTagihan;
              });
              debugPrint('[Toggle] New state: $_showFutureTagihan');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              margin: const EdgeInsets.only(top: 8, bottom: 8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          _showFutureTagihan
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          color: Colors.blue.shade700,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _showFutureTagihan
                                ? 'Sembunyikan Tagihan Bulan Depan'
                                : 'Tampilkan Tagihan Bulan Depan',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade700,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${sortedFutureKeys.length}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Future months (shown if toggle is on)
          if (_showFutureTagihan) ...[
            ...sortedFutureKeys.map((monthKey) {
              final items = futureTagihan[monthKey]!;
              return _buildMonthGroup(monthKey, items, isFuture: true);
            }),
          ],
        ],
      ],
    );
  }

  int _getMonthIndex(String monthName) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months.indexOf(monthName);
  }

  List<String> _sortMonthKeys(List<String> keys) {
    final monthOrder = [
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Tanpa Bulan'
    ];
    
    return keys..sort((a, b) {
      final monthA = a.split(' ')[0];
      final monthB = b.split(' ')[0];
      final indexA = monthOrder.indexOf(monthA);
      final indexB = monthOrder.indexOf(monthB);
      
      if (indexA == -1 && indexB == -1) return a.compareTo(b);
      if (indexA == -1) return 1;
      if (indexB == -1) return -1;
      
      // If same month, sort by year
      if (indexA == indexB) {
        final yearA = a.split(' ').length > 1 ? int.tryParse(a.split(' ')[1]) ?? 0 : 0;
        final yearB = b.split(' ').length > 1 ? int.tryParse(b.split(' ')[1]) ?? 0 : 0;
        return yearB.compareTo(yearA); // Descending year
      }
      
      return indexA.compareTo(indexB);
    });
  }

  Widget _buildMonthGroup(String monthKey, List<dynamic> items, {required bool isFuture}) {
    // Calculate totals for this month
    double totalSisa = 0;
    int countBelumBayar = 0;
    
    for (var item in items) {
      final sisa = double.tryParse(item['sisa']?.toString() ?? '0') ?? 0;
      totalSisa += sisa;
      if (item['status'] == 'belum_bayar' || item['status'] == 'sebagian') {
        countBelumBayar++;
      }
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Month Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: isFuture
                ? Colors.blue.shade50
                : Theme.of(context).colorScheme.primary.withAlpha(26),
            borderRadius: BorderRadius.circular(8),
            border: isFuture ? Border.all(color: Colors.blue.shade200) : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    if (isFuture)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Icon(
                          Icons.schedule,
                          size: 18,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            monthKey,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isFuture
                                  ? Colors.blue.shade700
                                  : Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          Text(
                            '${items.length} tagihan${isFuture ? ' (Bulan Depan)' : ''}',
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (totalSisa > 0)
                    Text(
                      'Sisa: Rp ${_formatCurrency(totalSisa)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: countBelumBayar > 0 ? Colors.red : Colors.orange,
                      ),
                    ),
                  if (countBelumBayar > 0)
                    Text(
                      '$countBelumBayar belum lunas',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.red,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        // Tagihan items for this month
        ...items.map((item) => _buildTagihanCard(item)),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildTagihanCard(Map<String, dynamic> tagihan) {
    final status = tagihan['status'] ?? '';
    final tagihanId = tagihan['id'] as int?;
    final hasPendingBukti = tagihan['has_pending_bukti'] == true;
    final isSelected =
        tagihanId != null && _selectedTagihanIds.contains(tagihanId);

    // Check if this tagihan is in draft
    return FutureBuilder<bool>(
      future: _checkIfInDraft(tagihanId),
      builder: (context, snapshot) {
        final isInDraft = snapshot.data ?? false;

        // Disable selection for paid, pending, or draft tagihan
        final canSelect = status != 'lunas' && !hasPendingBukti && !isInDraft;

        return _buildTagihanCardContent(
            tagihan, isSelected, canSelect, hasPendingBukti, isInDraft);
      },
    );
  }

  Future<bool> _checkIfInDraft(int? tagihanId) async {
    if (tagihanId == null) return false;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;
    if (santriId == null) return false;

    final prefs = await SharedPreferences.getInstance();
    
    // Check single payment draft
    final draftKey = 'payment_draft_${santriId}_$tagihanId';
    if (prefs.containsKey(draftKey)) return true;
    
    // Check multiple payment drafts
    final keys = prefs.getKeys().where((key) => 
      key.startsWith('payment_draft_multiple_$santriId')
    );
    
    for (final key in keys) {
      final draftJson = prefs.getString(key);
      if (draftJson != null) {
        try {
          final draft = json.decode(draftJson);
          if (draft['isMultiple'] == true && draft['tagihan'] is List) {
            final tagihan = draft['tagihan'] as List;
            for (var t in tagihan) {
              if (t is Map && t['id'] == tagihanId) {
                return true;
              }
            }
          }
        } catch (e) {
          debugPrint('Error checking draft: $e');
        }
      }
    }
    
    return false;
  }

  Widget _buildTagihanCardContent(
    Map<String, dynamic> tagihan,
    bool isSelected,
    bool canSelect,
    bool hasPendingBukti,
    bool isInDraft,
  ) {
    final status = tagihan['status'] ?? '';
    final tagihanId = tagihan['id'] as int?;

    final Color statusColor;
    final String statusText;

    // Priority: draft > pending bukti > status lunas > other statuses
    if (isInDraft) {
      statusColor = Colors.blue;
      statusText = 'DRAFT';
    } else if (hasPendingBukti) {
      statusColor = Colors.orange;
      statusText = 'PENDING';
    } else {
      switch (status) {
        case 'lunas':
          statusColor = Colors.green;
          statusText = 'LUNAS';
          break;
        case 'sebagian':
          statusColor = Colors.orange;
          statusText = 'SEBAGIAN';
          break;
        case 'belum_bayar':
        default:
          statusColor = Colors.red;
          statusText = 'BELUM BAYAR';
      }
    }

    final nominal = double.tryParse(tagihan['nominal'].toString()) ?? 0;
    final dibayar = double.tryParse(tagihan['dibayar'].toString()) ?? 0;
    final sisa = double.tryParse(tagihan['sisa'].toString()) ?? 0;
    final jenisTgh =
        tagihan['jenis_tagihan'] ?? tagihan['jenis_tagihan_id'] ?? 'Biaya';

    return GestureDetector(
      onTap: () {
        // Allow selection if item is selectable
        if (canSelect && tagihanId != null) {
          _toggleSelection(tagihanId);
        }
      },
      child: Opacity(
        opacity: (hasPendingBukti || isInDraft) ? 0.6 : 1.0,
        child: Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color:
              isSelected ? const Color(0xFF1976D2).withAlpha(26) : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (canSelect)
                      Checkbox(
                        value: isSelected,
                        onChanged: (bool? value) {
                          if (tagihanId != null) {
                            _toggleSelection(tagihanId);
                          }
                        },
                        activeColor: const Color(0xFF1976D2),
                      ),
                    if (hasPendingBukti)
                      const Padding(
                        padding: EdgeInsets.only(right: 8),
                        child: Icon(Icons.schedule,
                            color: Colors.orange, size: 20),
                      ),
                    Expanded(
                      child: Text(
                        jenisTgh.toString(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha(26),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                if (tagihan['deskripsi'] != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    tagihan['deskripsi'],
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Flexible(
                      child: Row(
                        children: [
                          if (tagihan['bulan'] != null) ...[
                            Icon(Icons.calendar_month,
                                size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                '${tagihan['bulan']} ${tagihan['tahun']}',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600]),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (tagihan['jatuh_tempo'] != null) ...[
                            Icon(Icons.event,
                                size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                'Jatuh tempo: ${tagihan['jatuh_tempo']}',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600]),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey[600])),
                          const SizedBox(height: 4),
                          Text(
                            'Rp ${_formatCurrency(nominal)}',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      if (dibayar > 0) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Terbayar',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600])),
                            const SizedBox(height: 4),
                            Text(
                              'Rp ${_formatCurrency(dibayar)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (sisa > 0) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('Sisa',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600])),
                            const SizedBox(height: 4),
                            Text(
                              'Rp ${_formatCurrency(sisa)}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: status == 'sebagian'
                                    ? Colors.orange
                                    : Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
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

// Riwayat Tab - Unified History with 3 tabs: Dompet, Pembayaran, Bukti Transfer
class RiwayatTab extends StatefulWidget {
  const RiwayatTab({super.key});

  @override
  State<RiwayatTab> createState() => _RiwayatTabState();
}

class _RiwayatTabState extends State<RiwayatTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _walletTransactions = [];
  List<dynamic> _pembayaranList = [];
  List<dynamic> _buktiTransferList = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadRiwayat();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadRiwayat() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santri = authProvider.activeSantri;

      if (santri == null) {
        setState(() {
          _errorMessage = 'Santri tidak ditemukan';
          _isLoading = false;
        });
        return;
      }

      final apiService = ApiService();

      // Get wallet transactions
      final walletResponse = await apiService.getWalletTransactions(santri.id);
      final walletData = walletResponse.data['data'] ?? [];

      // Get bukti transfer history
      final buktiResponse = await apiService.getBuktiHistory(santri.id);
      final buktiData = buktiResponse.data['data'] ?? [];

      // Separate data into 3 categories
      final walletList = <Map<String, dynamic>>[];
      final buktiList = <Map<String, dynamic>>[];

      // Process wallet transactions
      for (var item in walletData) {
        walletList.add({
          'type': 'wallet',
          'date': item['created_at'] ?? '',
          'description': item['description'] ?? '',
          'amount': item['amount'] ?? 0,
          'transaction_type': item['type'] ?? 'credit',
          'balance_after': item['balance_after'] ?? 0,
        });
      }

      // Process bukti transfer
      for (var item in buktiData) {
        final status = item['status'] ?? 'pending';
        buktiList.add({
          'type': 'bukti_transfer',
          'date': item['uploaded_at'] ?? item['created_at'] ?? '',
          'jenis_transaksi': item['jenis_transaksi'] ?? 'pembayaran',
          'amount': item['total_nominal'] ?? 0,
          'status': status,
          'catatan_wali': item['catatan_wali'],
          'catatan_admin': item['catatan_admin'],
          'bukti_url': item['bukti_url'],
          'processed_at': item['processed_at'],
          'tagihan': item['tagihan'] ?? [],
        });
      }

      // Sort each category by date descending
      walletList.sort((a, b) {
        final dateA = DateTime.tryParse(a['date'] ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b['date'] ?? '') ?? DateTime(2000);
        return dateB.compareTo(dateA);
      });

      buktiList.sort((a, b) {
        final dateA = DateTime.tryParse(a['date'] ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b['date'] ?? '') ?? DateTime(2000);
        return dateB.compareTo(dateA);
      });

      if (mounted) {
        setState(() {
          _walletTransactions = walletList;
          _buktiTransferList = buktiList;
          // Pembayaran will be fetched separately or extracted from bukti
          _pembayaranList =
              buktiList.where((b) => b['status'] == 'approved').toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Gagal memuat riwayat: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Riwayat'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadRiwayat,
            tooltip: 'Refresh',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.account_balance_wallet), text: 'Dompet'),
            Tab(icon: Icon(Icons.payment), text: 'Pembayaran'),
            Tab(icon: Icon(Icons.receipt_long), text: 'Bukti Transfer'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadRiwayat,
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // Tab 1: Wallet Transactions
                    _buildWalletTab(),
                    // Tab 2: Pembayaran (Approved Bukti)
                    _buildPembayaranTab(),
                    // Tab 3: Bukti Transfer
                    _buildBuktiTransferTab(),
                  ],
                ),
    );
  }

  Widget _buildWalletTab() {
    if (_walletTransactions.isEmpty) {
      return const Center(child: Text('Belum ada transaksi dompet'));
    }
    return RefreshIndicator(
      onRefresh: _loadRiwayat,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _walletTransactions.length,
        itemBuilder: (context, index) {
          final item = _walletTransactions[index];
          return _buildWalletCard(item);
        },
      ),
    );
  }

  Widget _buildPembayaranTab() {
    if (_pembayaranList.isEmpty) {
      return const Center(child: Text('Belum ada pembayaran yang disetujui'));
    }
    return RefreshIndicator(
      onRefresh: _loadRiwayat,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _pembayaranList.length,
        itemBuilder: (context, index) {
          final item = _pembayaranList[index];
          return _buildBuktiTransferCard(item);
        },
      ),
    );
  }

  Widget _buildBuktiTransferTab() {
    if (_buktiTransferList.isEmpty) {
      return const Center(child: Text('Belum ada bukti transfer'));
    }
    return RefreshIndicator(
      onRefresh: _loadRiwayat,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _buktiTransferList.length,
        itemBuilder: (context, index) {
          final item = _buktiTransferList[index];
          return _buildBuktiTransferCard(item);
        },
      ),
    );
  }

  Widget _buildWalletCard(Map<String, dynamic> item) {
    final transactionType = item['transaction_type'];
    final amount = (item['amount'] as num).toDouble();
    final isCredit = transactionType == 'credit';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              isCredit ? Colors.green.shade100 : Colors.red.shade100,
          child: Icon(
            isCredit ? Icons.add : Icons.remove,
            color: isCredit ? Colors.green : Colors.red,
          ),
        ),
        title: Text(item['description'] ?? 'Transaksi Dompet'),
        subtitle: Text(
          _formatDate(item['date'] ?? ''),
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isCredit ? '+' : '-'}Rp ${_formatNumber(amount)}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isCredit ? Colors.green : Colors.red,
              ),
            ),
            Text(
              'Saldo: Rp ${_formatNumber(item['balance_after'] ?? 0)}',
              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBuktiTransferCard(Map<String, dynamic> item) {
    final status = item['status'] ?? 'pending';
    final jenisTransaksi = item['jenis_transaksi'] ?? 'pembayaran';

    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (status) {
      case 'approved':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Disetujui';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'Ditolak';
        break;
      default:
        statusColor = Colors.orange;
        statusIcon = Icons.pending;
        statusText = 'Menunggu';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.2),
          child: Icon(statusIcon, color: statusColor),
        ),
        title: Text(_getJenisTransaksiLabel(jenisTransaksi)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _formatDate(item['date'] ?? ''),
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                        fontSize: 11,
                        color: statusColor,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Text(
          'Rp ${_formatNumber(item['amount'] ?? 0)}',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item['catatan_wali'] != null &&
                    item['catatan_wali'].toString().isNotEmpty) ...[
                  const Text('Catatan Wali:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(item['catatan_wali']),
                  const SizedBox(height: 12),
                ],
                if (status == 'rejected' && item['catatan_admin'] != null) ...[
                  const Text('Alasan Ditolak:',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.red)),
                  const SizedBox(height: 4),
                  Text(item['catatan_admin'],
                      style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 12),
                ],
                if (status == 'approved' && item['processed_at'] != null) ...[
                  Text('Disetujui pada: ${_formatDate(item['processed_at'])}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                  const SizedBox(height: 12),
                ],
                if ((item['tagihan'] as List).isNotEmpty) ...[
                  const Text('Tagihan yang dibayar:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...(item['tagihan'] as List).map((t) => Padding(
                        padding: const EdgeInsets.only(left: 8, bottom: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle,
                                size: 16, color: Colors.green),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${t['jenis']} - ${t['bulan']} ${t['tahun']}',
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                            Text(
                              'Rp ${_formatNumber(t['nominal'])}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getJenisTransaksiLabel(String jenis) {
    switch (jenis) {
      case 'topup':
        return 'Top-up Dompet';
      case 'pembayaran':
        return 'Pembayaran Tagihan';
      case 'pembayaran_topup':
        return 'Pembayaran + Top-up';
      default:
        return 'Transaksi';
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateStr;
    }
  }

  String _formatNumber(dynamic number) {
    final value = double.tryParse(number.toString()) ?? 0.0;
    return value.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}

// Profile Tab
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await authProvider.refreshData();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: const Icon(Icons.person,
                          size: 50, color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      authProvider.currentUser?.nama ?? 'Wali Santri',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      authProvider.currentUser?.noHp ?? '',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    if (authProvider.currentUser?.label != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        authProvider.currentUser!.label!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit Profile'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // TODO: Navigate to edit profile
              },
            ),
            ListTile(
              leading: const Icon(Icons.lock),
              title: const Text('Ubah Password'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/change-password');
              },
            ),
            ListTile(
              leading: const Icon(Icons.info),
              title: const Text('Tentang Aplikasi'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // TODO: Show about dialog
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Konfirmasi'),
                    content: const Text('Apakah Anda yakin ingin logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Batal'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                        ),
                        child: const Text('Logout'),
                      ),
                    ],
                  ),
                );

                if (confirm != true) return;
                if (!context.mounted) return;

                await authProvider.logout();
                if (!context.mounted) return;

                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text('Logout'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Draft Pembayaran List Widget
class _DraftPembayaranList extends StatefulWidget {
  const _DraftPembayaranList();

  @override
  State<_DraftPembayaranList> createState() => _DraftPembayaranListState();
}

class _DraftPembayaranListState extends State<_DraftPembayaranList> {
  List<Map<String, dynamic>> _drafts = [];

  @override
  void initState() {
    super.initState();
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs
        .getKeys()
        .where((key) => key.startsWith('payment_draft_'))
        .toList();

    final List<Map<String, dynamic>> drafts = [];
    for (final key in keys) {
      final draftJson = prefs.getString(key);
      if (draftJson != null) {
        try {
          final draft = json.decode(draftJson);
          draft['key'] = key; // Store key for deletion
          
          // Debug info
          if (draft['isMultiple'] == true) {
            debugPrint('[Load Draft] Multiple payment draft found');
            debugPrint('[Load Draft] Tagihan count: ${draft['tagihan']?.length ?? 0}');
            debugPrint('[Load Draft] Topup: ${draft['topupAmount']}');
          }
          
          drafts.add(draft);
        } catch (e) {
          debugPrint('Error parsing draft: $e');
        }
      }
    }

    // Sort by timestamp, newest first
    drafts.sort((a, b) {
      final aTime = DateTime.tryParse(a['timestamp'] ?? '') ?? DateTime.now();
      final bTime = DateTime.tryParse(b['timestamp'] ?? '') ?? DateTime.now();
      return bTime.compareTo(aTime);
    });

    if (mounted) {
      setState(() => _drafts = drafts);
    }
  }

  Future<void> _deleteDraft(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
    _loadDrafts();
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  String _timeAgo(String timestamp) {
    final date = DateTime.tryParse(timestamp);
    if (date == null) return 'Baru saja';

    final diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return '${diff.inDays} hari lalu';
    if (diff.inHours > 0) return '${diff.inHours} jam lalu';
    if (diff.inMinutes > 0) return '${diff.inMinutes} menit lalu';
    return 'Baru saja';
  }

  @override
  Widget build(BuildContext context) {
    if (_drafts.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadDrafts,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height - 200,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.drafts_outlined,
                        size: 80, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Tidak ada draft pembayaran',
                      style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Draft akan tersimpan otomatis saat Anda keluar\ndari halaman pembayaran sebelum upload bukti',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadDrafts,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _drafts.length,
        itemBuilder: (context, index) {
          final draft = _drafts[index];
          final isMultiple = draft['isMultiple'] == true;
          
          // For multiple payment
          final List<dynamic>? multipleTagihan = isMultiple ? draft['tagihan'] : null;
          
          // For single payment
          final paymentAmount = draft['paymentAmount'] ?? 0.0;
          final topupAmount = draft['topupAmount'] ?? 0.0;
          
          double total;
          String title;
          String subtitle = '';
          
          if (isMultiple && multipleTagihan != null) {
            // Multiple payment draft
            double tagihanTotal = 0;
            for (var t in multipleTagihan) {
              if (t is Map) {
                tagihanTotal += double.tryParse(t['sisa']?.toString() ?? '0') ?? 0;
              }
            }
            final topup = draft['topupAmount'] ?? 0.0;
            total = tagihanTotal + topup;
            
            title = '${multipleTagihan.length} Tagihan';
            if (topup > 0) {
              subtitle = '+ Top-up Dompet';
            }
          } else {
            // Single payment draft
            total = paymentAmount + topupAmount;
            title = draft['jenisTagihan'] ?? 'Tagihan';
            
            final bulan = draft['bulan'];
            final tahun = draft['tahun'];
            if (bulan != null && tahun != null) {
              subtitle = '$bulan $tahun';
            }
            if (topupAmount > 0) {
              subtitle += subtitle.isEmpty ? 'Top-up Dompet' : ' + Top-up';
            }
          }
          
          final catatan = draft['catatan'] ?? '';
          final timestamp = draft['timestamp'] ?? '';
          final totalTagihan = draft['totalTagihan'] ?? 0.0;
          final sudahDibayar = draft['sudahDibayar'] ?? 0.0;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                // Navigate to upload screen with draft data
                debugPrint('[Draft Tap] ===== START =====');
                debugPrint('[Draft Tap] Draft data: ${draft.toString()}');
                debugPrint('[Draft Tap] isMultiple from draft: ${draft['isMultiple']}');
                debugPrint('[Draft Tap] tagihan from draft: ${draft['tagihan']}');
                
                final isMultipleTap = draft['isMultiple'] == true;
                final multipleTagihanTap = isMultipleTap ? draft['tagihan'] as List<dynamic>? : null;
                
                debugPrint('[Draft Tap] isMultiple: $isMultipleTap');
                debugPrint('[Draft Tap] multipleTagihan: ${multipleTagihanTap?.length}');
                debugPrint('[Draft Tap] topupAmount: ${draft['topupAmount']}');
                
                if (isMultipleTap && multipleTagihanTap != null) {
                  // Multiple payment draft
                  final tagihanIds = multipleTagihanTap
                      .map((t) => t is Map ? t['id'] as int? : null)
                      .where((id) => id != null)
                      .cast<int>()
                      .toList();
                  
                  debugPrint('[Draft Tap] Navigating to multiple payment with ${tagihanIds.length} tagihan');
                  debugPrint('[Draft Tap] Arguments: isMultiplePayment=true, fromDraft=true');
                  
                  // Convert multipleTagihan to proper List<Map<String, dynamic>>
                  final selectedTagihan = multipleTagihanTap
                      .map((t) => t is Map ? Map<String, dynamic>.from(t) : null)
                      .where((t) => t != null)
                      .cast<Map<String, dynamic>>()
                      .toList();
                  
                  debugPrint('[Draft Tap] selectedTagihan prepared: ${selectedTagihan.length} items');
                  
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => UnifiedPaymentScreen(
                        isMultiplePayment: true,
                        multipleTagihan: selectedTagihan,
                        selectedBankId: draft['selectedBankId'] as int?,
                        shouldIncludeTopup: (draft['topupAmount'] ?? 0.0) > 0,
                        topupNominal: (draft['topupAmount'] ?? 0.0) as double?,
                        fromDraft: true,
                      ),
                    ),
                  ).then((result) {
                    if (result == true) {
                      _loadDrafts(); // Refresh draft list
                    }
                  });
                } else {
                  // Single payment draft - navigate to UnifiedPaymentScreen
                  final tagihan = {
                    'id': draft['tagihanId'],
                    'jenis_tagihan': draft['jenisTagihan'],
                    'bulan': draft['bulan'],
                    'tahun': draft['tahun'],
                    'sisa': paymentAmount,
                    'nominal': totalTagihan,
                    'dibayar': sudahDibayar,
                  };
                  
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => UnifiedPaymentScreen(
                        tagihan: tagihan,
                        topupNominal: topupAmount,
                        shouldIncludeTopup: topupAmount > 0,
                        selectedBankId: draft['selectedBankId'],
                        fromDraft: true, // Prevent creating new draft
                      ),
                    ),
                  ).then((result) {
                    if (result == true) {
                      _loadDrafts(); // Refresh draft list
                    }
                  });
                }
              },
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isMultiple ? Icons.receipt_long : Icons.pending_actions,
                            color: Colors.orange.shade700,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              if (subtitle.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  subtitle,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 2),
                              Text(
                                _timeAgo(timestamp),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline,
                              color: Colors.red),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Hapus Draft'),
                                content: const Text(
                                    'Yakin ingin menghapus draft ini?'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Batal'),
                                  ),
                                  ElevatedButton(
                                    onPressed: () {
                                      _deleteDraft(draft['key']);
                                      Navigator.pop(context);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                    ),
                                    child: const Text('Hapus'),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    // Info Tagihan
                    if (totalTagihan > 0) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total Tagihan',
                            style: TextStyle(
                                color: Colors.grey[600], fontSize: 13),
                          ),
                          Text(
                            'Rp ${_formatCurrency(totalTagihan)}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w500, fontSize: 13),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Sudah Dibayar',
                            style: TextStyle(
                                color: Colors.grey[600], fontSize: 13),
                          ),
                          Text(
                            'Rp ${_formatCurrency(sudahDibayar)}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w500, fontSize: 13),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Divider(height: 16),
                    ],
                    if (paymentAmount > 0) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Pembayaran Tagihan',
                            style: TextStyle(color: Colors.grey[700]),
                          ),
                          Text(
                            'Rp ${_formatCurrency(paymentAmount)}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (topupAmount > 0) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Top-up Dompet',
                            style: TextStyle(color: Colors.grey[700]),
                          ),
                          Text(
                            'Rp ${_formatCurrency(topupAmount)}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Transfer',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          'Rp ${_formatCurrency(total)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: Color(0xFF1976D2),
                          ),
                        ),
                      ],
                    ),
                    if (catatan.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.note, size: 16, color: Colors.grey[600]),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                catatan,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Batalkan Pembayaran'),
                                  content: const Text(
                                      'Yakin ingin membatalkan draft pembayaran ini? Tagihan akan bisa dipilih kembali.'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Tidak'),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        _deleteDraft(draft['key']);
                                        Navigator.pop(context);
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          const SnackBar(
                                              content: Text(
                                                  'Draft pembayaran dibatalkan')),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.red,
                                      ),
                                      child: const Text('Ya, Batalkan'),
                                    ),
                                  ],
                                ),
                              );
                            },
                            icon: const Icon(Icons.cancel_outlined),
                            label: const Text('Batalkan'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              final authProvider = Provider.of<AuthProvider>(
                                  context,
                                  listen: false);
                              final santriId = authProvider.activeSantri?.id;

                              if (santriId == null) return;

                              // Check if this is a multiple payment draft
                              final isMultipleDraft = draft['isMultiple'] == true;
                              
                              if (isMultipleDraft) {
                                // Multiple payment draft
                                final multipleTagihanDraft = draft['tagihan'] as List<dynamic>?;
                                
                                if (multipleTagihanDraft != null) {
                                  final selectedTagihan = multipleTagihanDraft
                                      .map((t) => t is Map ? Map<String, dynamic>.from(t) : null)
                                      .where((t) => t != null)
                                      .cast<Map<String, dynamic>>()
                                      .toList();
                                  
                                  debugPrint('[Upload Bukti Button] Multiple payment - ${selectedTagihan.length} tagihan');
                                  
                                  final result = await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => UnifiedPaymentScreen(
                                        isMultiplePayment: true,
                                        multipleTagihan: selectedTagihan,
                                        selectedBankId: draft['selectedBankId'] as int?,
                                        shouldIncludeTopup: (draft['topupAmount'] ?? 0.0) > 0,
                                        topupNominal: (draft['topupAmount'] ?? 0.0) as double?,
                                        fromDraft: true,
                                      ),
                                    ),
                                  );
                                  
                                  if (result == true) {
                                    _loadDrafts();
                                    if (context.mounted) {
                                      final pembayaranState =
                                          context.findAncestorStateOfType<
                                              _PembayaranTabState>();
                                      pembayaranState?._loadTagihan();
                                    }
                                  }
                                }
                              } else {
                                // Single payment draft - original code
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => UnifiedPaymentScreen(
                                      tagihan: draft['tagihanId'] != null
                                          ? {
                                              'id': draft['tagihanId'],
                                              'jenis_tagihan':
                                                  draft['jenisTagihan'] ??
                                                      'Tagihan',
                                              'bulan': draft['bulan'],
                                              'tahun': draft['tahun'],
                                              'sisa': draft['paymentAmount']
                                                  .toString(),
                                              'nominal': draft['totalTagihan']
                                                      ?.toString() ??
                                                  '0',
                                              'jumlah': draft['totalTagihan']
                                                      ?.toString() ??
                                                  '0',
                                              'dibayar': draft['sudahDibayar']
                                                      ?.toString() ??
                                                  '0',
                                              'sudah_dibayar':
                                                  draft['sudahDibayar']
                                                          ?.toString() ??
                                                      '0',
                                            }
                                          : null,
                                      isTopupOnly: draft['tagihanId'] == null,
                                      topupNominal: draft['topupAmount'] > 0
                                          ? draft['topupAmount']
                                          : null,
                                      shouldIncludeTopup:
                                          draft['topupAmount'] > 0,
                                      selectedBankId: draft['selectedBankId'],
                                      fromDraft: true,
                                    ),
                                  ),
                                );

                                if (result == true) {
                                  _loadDrafts();
                                  if (context.mounted) {
                                    final pembayaranState =
                                        context.findAncestorStateOfType<
                                            _PembayaranTabState>();
                                    pembayaranState?._loadTagihan();
                                  }
                                }
                              }
                            },
                            icon: const Icon(Icons.upload_file),
                            label: const Text('Upload Bukti'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// Notification Bell Widget dengan Badge
class _NotificationBellWidget extends StatefulWidget {
  final String santriId;

  const _NotificationBellWidget({required this.santriId});

  @override
  State<_NotificationBellWidget> createState() =>
      _NotificationBellWidgetState();
}

class _NotificationBellWidgetState extends State<_NotificationBellWidget> {
  final ApiService _api = ApiService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUnreadCount();
    // Auto-refresh disabled to reduce server load
    // Badge will only update when user manually opens notifications
  }

  Future<void> _loadUnreadCount() async {
    if (widget.santriId.isEmpty) return;
    try {
      final res = await _api.getUnreadNotificationCount(widget.santriId);
      if (res.statusCode == 200 && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _unreadCount = res.data['unread_count'] ?? 0;
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading unread count: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: const Icon(Icons.notifications),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => NotificationScreen(santriId: widget.santriId),
              ),
            ).then((_) => _loadUnreadCount()); // Refresh saat kembali
          },
          tooltip: 'Notifikasi',
        ),
        if (_unreadCount > 0)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 18,
                minHeight: 18,
              ),
              child: Text(
                _unreadCount > 99 ? '99+' : _unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
