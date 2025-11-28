import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
// models import removed because types aren't used in this file
import 'login_screen.dart';

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
      const TunggakanTab(),
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
            icon: Icon(Icons.receipt_long),
            label: 'Tunggakan',
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
                      if (santri?.fotoUrl != null) {
                        debugPrint('[HomeScreen] Foto URL: ${santri!.fotoUrl}');
                      }
                      return CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.white,
                        backgroundImage: santri?.fotoUrl != null && santri!.fotoUrl!.isNotEmpty
                            ? NetworkImage(santri.fotoUrl!)
                            : null,
                        onBackgroundImageError: santri?.fotoUrl != null
                            ? (exception, stackTrace) {
                                debugPrint('[HomeScreen] Error loading foto: $exception');
                              }
                            : null,
                        child: santri?.fotoUrl == null || santri!.fotoUrl!.isEmpty
                            ? Icon(
                                santri?.jenisKelamin == 'L' ? Icons.boy : Icons.girl,
                                size: 50,
                                color: Theme.of(context).colorScheme.primary,
                              )
                            : null,
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  // Nama Santri
                  Text(
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
                            Text(
                              'Limit Harian: Rp ${_formatCurrency(santri?.limitHarian ?? 15000)}',
                              style: TextStyle(
                                fontSize: 12,
                                 color: Colors.white.withAlpha(230),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
                    icon: Icons.receipt_long,
                    title: 'Tunggakan',
                    color: Colors.orange,
                    onTap: () {
                      // Navigate to Tunggakan tab (index 2)
                      debugPrint('QuickMenu: Tunggakan tapped');
                      if (onNavigateToTab != null) {
                        onNavigateToTab!(2);
                      } else {
                        final homeState = context.findAncestorStateOfType<_HomeScreenState>();
                        if (homeState != null) {
                          homeState.navigateTo(2);
                        } else if (HomeScreen.homeKey.currentState != null) {
                          HomeScreen.navigateToTab(2);
                        } else {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    HomeScreen(key: HomeScreen.homeKey, initialIndex: 2)),
                          );
                        }
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Navigasi ke Tunggakan')),
                      );
                    },
                  ),
                  _buildQuickMenu(
                    context,
                    icon: Icons.history,
                    title: 'Riwayat',
                    color: Colors.blue,
                    onTap: () {
                      debugPrint('QuickMenu: Riwayat tapped');
                      if (onNavigateToTab != null) {
                        onNavigateToTab!(1);
                      } else {
                        final homeState = context.findAncestorStateOfType<_HomeScreenState>();
                        if (homeState != null) {
                          homeState.navigateTo(1);
                        } else if (HomeScreen.homeKey.currentState != null) {
                          HomeScreen.navigateToTab(1);
                        } else {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    HomeScreen(key: HomeScreen.homeKey, initialIndex: 1)),
                          );
                        }
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Navigasi ke Riwayat/Pembayaran')),
                      );
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
                        final homeState = context.findAncestorStateOfType<_HomeScreenState>();
                        if (homeState != null) {
                          homeState.navigateTo(1);
                        } else if (HomeScreen.homeKey.currentState != null) {
                          HomeScreen.navigateToTab(1);
                        } else {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    HomeScreen(key: HomeScreen.homeKey, initialIndex: 1)),
                          );
                        }
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Navigasi ke Pembayaran (Bayar)')),
                      );
                    },
                  ),
                  _buildQuickMenu(
                    context,
                    icon: Icons.notifications,
                    title: 'Notifikasi',
                    color: Colors.purple,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Fitur notifikasi segera hadir')),
                      );
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

class _PembayaranTabState extends State<PembayaranTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  Map<String, dynamic>? _tagihanData;
  final Set<int> _selectedTagihanIds = {};
  
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
      final allTagihan = _tagihanData!['data']?['semua'] as List?;
      if (allTagihan == null) return [];
      
      return allTagihan
          .whereType<Map>()
          .where((t) {
            final id = t['id'];
            return id != null && _selectedTagihanIds.contains(id);
          })
          .map((t) => Map<String, dynamic>.from(t))
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
            Tab(text: 'Tunggakan'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadTagihan,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildTagihanList(_tagihanData?['data']?['semua'] ?? []),
                        _buildTagihanList(_tagihanData?['data']?['lunas'] ?? []),
                        _buildTagihanList(_tagihanData?['data']?['belum_bayar'] ?? []),
                        _buildTagihanList(_tagihanData?['data']?['tunggakan'] ?? []),
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
                            onPressed: _selectedTagihanIds.isEmpty ? null : () {
                              try {
                                final selectedTagihan = _getSelectedTagihan();
                                debugPrint('[Bayar Button] Selected tagihan count: ${selectedTagihan.length}');
                                debugPrint('[Bayar Button] Total: $totalSelected');
                                
                                // Navigate to upload bukti screen
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
                                ScaffoldMessenger.of(context).showSnackBar(
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
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Tidak ada data',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tagihan.length,
      itemBuilder: (context, index) {
        final item = tagihan[index];
        return _buildTagihanCard(item);
      },
    );
  }

  Widget _buildTagihanCard(Map<String, dynamic> tagihan) {
    final status = tagihan['status'] ?? '';
    final tagihanId = tagihan['id'] as int?;
    final hasPendingBukti = tagihan['has_pending_bukti'] == true;
    final isSelected = tagihanId != null && _selectedTagihanIds.contains(tagihanId);
    
    // Disable selection for paid or pending tagihan
    final canSelect = status != 'lunas' && !hasPendingBukti;
    
    final Color statusColor;
    final String statusText;

    // Priority: pending bukti > status lunas > other statuses
    if (hasPendingBukti) {
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
    final jenisTgh = tagihan['jenis_tagihan'] ?? tagihan['jenis_tagihan_id'] ?? 'Biaya';

    return GestureDetector(
      onTap: () {
        // Allow selection if item is selectable
        if (canSelect && tagihanId != null) {
          _toggleSelection(tagihanId);
        }
      },
      child: Opacity(
        opacity: hasPendingBukti ? 0.6 : 1.0,
        child: Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: isSelected ? const Color(0xFF1976D2).withAlpha(26) : Colors.white,
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
                      child: Icon(Icons.schedule, color: Colors.orange, size: 20),
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
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                    Icon(Icons.calendar_month, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        '${tagihan['bulan']} ${tagihan['tahun']}',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  if (tagihan['jatuh_tempo'] != null) ...[
                    Icon(Icons.event, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Jatuh tempo: ${tagihan['jatuh_tempo']}',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
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
                      Text('Total', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 4),
                      Text(
                        'Rp ${_formatCurrency(nominal)}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  if (dibayar > 0) ...[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Terbayar', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
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
                        Text('Sisa', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                        const SizedBox(height: 4),
                        Text(
                          'Rp ${_formatCurrency(sisa)}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: status == 'sebagian' ? Colors.orange : Colors.red,
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

// Tunggakan Tab
class TunggakanTab extends StatelessWidget {
  const TunggakanTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tunggakan'),
      ),
      body: const Center(
        child: Text('Daftar Tunggakan - Coming Soon'),
      ),
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: const Icon(Icons.person, size: 50, color: Colors.white),
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
              // TODO: Navigate to change password
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
    );
  }
}
