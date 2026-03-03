import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/widgets/riwayat/riwayat_cards.dart';

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
          return WalletTransactionCard(item: item, formatNumber: _formatNumber, formatDate: _formatDate);
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
          return BuktiTransferCard(item: item, formatNumber: _formatNumber, formatDate: _formatDate);
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
          return BuktiTransferCard(item: item, formatNumber: _formatNumber, formatDate: _formatDate);
        },
      ),
    );
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
