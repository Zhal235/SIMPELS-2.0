import 'package:flutter/material.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/models/bukti_transfer.dart';
import 'package:simpels_mobile/widgets/bukti/bukti_card.dart';

class BuktiHistoryScreen extends StatefulWidget {
  final String santriId;
  final String santriName;

  const BuktiHistoryScreen({
    super.key,
    required this.santriId,
    required this.santriName,
  });

  @override
  State<BuktiHistoryScreen> createState() => _BuktiHistoryScreenState();
}

class _BuktiHistoryScreenState extends State<BuktiHistoryScreen>
    with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  List<BuktiTransfer> _allBukti = [];
  List<BuktiTransfer> _filteredBukti = [];
  bool _loading = true;
  String _selectedFilter = 'all';
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _onTabChanged(_tabController.index);
      }
    });
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged(int index) {
    setState(() {
      switch (index) {
        case 0:
          _selectedFilter = 'all';
          break;
        case 1:
          _selectedFilter = 'pending';
          break;
        case 2:
          _selectedFilter = 'approved';
          break;
      }
      _applyFilter();
    });
  }

  Future<void> _loadHistory() async {
    setState(() => _loading = true);
    try {
      final response = await _api.getBuktiHistory(widget.santriId);
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          final List<dynamic> buktiList = data['data'] ?? [];
          final List<BuktiTransfer> parsedList = [];
          for (var i = 0; i < buktiList.length; i++) {
            try {
              parsedList.add(
                  BuktiTransfer.fromJson(buktiList[i] as Map<String, dynamic>));
            } catch (_) {}
          }
          setState(() {
            _allBukti = parsedList;
            _applyFilter();
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Gagal memuat riwayat: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilter() {
    if (_selectedFilter == 'all') {
      _filteredBukti = List.from(_allBukti);
    } else {
      _filteredBukti =
          _allBukti.where((b) => b.status == _selectedFilter).toList();
    }
    _filteredBukti.sort((a, b) => b.uploadedAt.compareTo(a.uploadedAt));
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _allBukti.where((b) => b.status == 'pending').length;
    final approvedCount =
        _allBukti.where((b) => b.status == 'approved').length;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Riwayat Bukti Transfer',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(widget.santriName,
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Semua'),
                  if (_allBukti.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _badgeChip('${_allBukti.length}', Colors.white.withOpacity(0.2)),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Pending'),
                  if (pendingCount > 0) ...[
                    const SizedBox(width: 6),
                    _badgeChip('$pendingCount', Colors.orange.withOpacity(0.9)),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Disetujui'),
                  if (approvedCount > 0) ...[
                    const SizedBox(width: 6),
                    _badgeChip('$approvedCount', Colors.green.withOpacity(0.9)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadHistory,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _filteredBukti.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredBukti.length,
                    itemBuilder: (context, index) =>
                        BuktiCard(bukti: _filteredBukti[index]),
                  ),
      ),
    );
  }

  Widget _badgeChip(String label, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label,
          style:
              const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildEmptyState() {
    final IconData icon;
    final String message;
    final Color color;

    switch (_selectedFilter) {
      case 'pending':
        icon = Icons.schedule;
        message = 'Tidak ada bukti transfer yang menunggu verifikasi';
        color = Colors.orange;
        break;
      case 'approved':
        icon = Icons.check_circle_outline;
        message = 'Belum ada bukti transfer yang disetujui';
        color = Colors.green;
        break;
      case 'rejected':
        icon = Icons.cancel_outlined;
        message = 'Tidak ada bukti transfer yang ditolak';
        color = Colors.red;
        break;
      default:
        icon = Icons.receipt_long;
        message = 'Belum ada riwayat bukti transfer';
        color = Colors.grey;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: color.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: _loadHistory,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.primary),
          ),
        ],
      ),
    );
  }
}
