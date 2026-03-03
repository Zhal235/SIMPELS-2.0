import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
// models import removed because types aren't used in this file
import 'package:simpels_mobile/screens/home/tabs/profile_tab.dart';
import 'package:simpels_mobile/screens/home/tabs/dashboard_tab.dart';
import 'package:simpels_mobile/screens/home/tabs/pembayaran_tab.dart';

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

// Pembayaran Tab
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

      // Get wallet transactions (dedicated history endpoint)
      final walletResponse = await apiService.getWalletHistory(santri.id);
      final rawWalletData = walletResponse.data['data'];
      final walletData = rawWalletData is List ? rawWalletData : [];

      // Get bukti transfer history
      final buktiResponse = await apiService.getBuktiHistory(santri.id);
      final rawBuktiData = buktiResponse.data['data'];
      final buktiData = rawBuktiData is List ? rawBuktiData : [];

      // Separate data into 3 categories
      final walletList = <Map<String, dynamic>>[];
      final buktiList = <Map<String, dynamic>>[];

      // Process wallet transactions (fields: tanggal, keterangan, jumlah, tipe, saldo_akhir)
      for (var item in walletData) {
        walletList.add({
          'type': 'wallet',
          'date': item['tanggal'] ?? item['created_at'] ?? '',
          'description': item['keterangan'] ?? item['description'] ?? '',
          'amount': item['jumlah'] ?? item['amount'] ?? 0,
          'transaction_type': item['tipe'] ?? item['type'] ?? 'credit',
          'balance_after': item['saldo_akhir'] ?? item['balance_after'] ?? 0,
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
// Draft Pembayaran List Widget
