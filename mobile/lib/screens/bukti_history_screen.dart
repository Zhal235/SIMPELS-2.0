import 'package:flutter/material.dart';
import 'dart:io';
import '../services/api_service.dart';
import '../models/bukti_transfer.dart';

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
  String _selectedFilter = 'all'; // all, pending, approved, rejected
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
          
          // Parse dengan error handling per item
          final List<BuktiTransfer> parsedList = [];
          for (var i = 0; i < buktiList.length; i++) {
            try {
              final bukti = BuktiTransfer.fromJson(buktiList[i] as Map<String, dynamic>);
              parsedList.add(bukti);
            } catch (e) {
              // Silent fail for individual items
            }
          }
          
          setState(() {
            _allBukti = parsedList;
            _applyFilter();
          });
        }
      }
    } catch (e) {
      // Error handled silently in production
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memuat riwayat: $e'),
            backgroundColor: Colors.red,
          ),
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
      _filteredBukti = _allBukti.where((b) => b.status == _selectedFilter).toList();
    }
    // Sort by upload date descending (newest first)
    _filteredBukti.sort((a, b) => b.uploadedAt.compareTo(a.uploadedAt));
  }

  String _formatCurrency(double amount) {
    final value = amount.toStringAsFixed(0);
    return 'Rp ${value.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}';
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.schedule;
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  void _showDetailDialog(BuktiTransfer bukti) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Status Badge
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: _getStatusColor(bukti.status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _getStatusColor(bukti.status),
                            width: 2,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _getStatusIcon(bukti.status),
                              color: _getStatusColor(bukti.status),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              bukti.statusLabel,
                              style: TextStyle(
                                color: _getStatusColor(bukti.status),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Jenis Transaksi
                    _buildInfoCard(
                      icon: Icons.payment,
                      title: 'Jenis Transaksi',
                      value: bukti.jenisTransaksiLabel,
                      color: Colors.blue,
                    ),
                    const SizedBox(height: 12),

                    // Total Nominal
                    _buildInfoCard(
                      icon: Icons.attach_money,
                      title: 'Total Nominal',
                      value: _formatCurrency(bukti.totalNominal),
                      color: Colors.green,
                    ),
                    const SizedBox(height: 12),

                    // Tanggal Upload
                    _buildInfoCard(
                      icon: Icons.upload,
                      title: 'Tanggal Upload',
                      value: _formatDate(bukti.uploadedAt),
                      color: Colors.purple,
                    ),
                    const SizedBox(height: 12),

                    // Tanggal Diproses (if processed)
                    if (bukti.processedAt != null) ...[
                      _buildInfoCard(
                        icon: Icons.verified,
                        title: 'Tanggal Diproses',
                        value: _formatDate(bukti.processedAt!),
                        color: Colors.teal,
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Diproses Oleh
                    if (bukti.processedBy != null) ...[
                      _buildInfoCard(
                        icon: Icons.person,
                        title: 'Diproses Oleh',
                        value: bukti.processedBy!,
                        color: Colors.indigo,
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Catatan Wali
                    if (bukti.catatanWali != null && bukti.catatanWali!.isNotEmpty) ...[
                      _buildNoteCard(
                        title: 'Catatan Anda',
                        content: bukti.catatanWali!,
                        icon: Icons.note,
                        color: Colors.blue,
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Catatan Admin (especially important for rejected)
                    if (bukti.catatanAdmin != null && bukti.catatanAdmin!.isNotEmpty) ...[
                      _buildNoteCard(
                        title: bukti.status == 'rejected' 
                            ? 'Alasan Penolakan' 
                            : 'Catatan Admin',
                        content: bukti.catatanAdmin!,
                        icon: bukti.status == 'rejected' 
                            ? Icons.warning 
                            : Icons.admin_panel_settings,
                        color: bukti.status == 'rejected' 
                            ? Colors.red 
                            : Colors.orange,
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Tagihan Details
                    if (bukti.tagihan != null && bukti.tagihan!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Detail Tagihan',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...bukti.tagihan!.map((t) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.jenis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            if (t.bulan != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                '${t.bulan} ${t.tahun}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Nominal:',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                Text(
                                  _formatCurrency(t.nominal),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      )),
                    ],

                    const SizedBox(height: 20),

                    // Bukti Transfer Image
                    Builder(
                      builder: (context) {
                        // Convert URL using ApiService helper
                        final originalUrl = bukti.buktiUrl;
                        final fullUrl = ApiService.getFullImageUrl(originalUrl);
                        
                        debugPrint('[BuktiHistory] ========== IMAGE DEBUG ==========');
                        debugPrint('[BuktiHistory] Original URL: $originalUrl');
                        debugPrint('[BuktiHistory] Converted URL: $fullUrl');
                        try {
                          debugPrint('[BuktiHistory] Platform: ${Platform.isAndroid ? "Android" : Platform.isIOS ? "iOS" : "Web"}');
                        } catch (e) {
                          debugPrint('[BuktiHistory] Platform: Web/Unknown');
                        }
                        debugPrint('[BuktiHistory] ====================================');
                        
                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              fullUrl,
                              fit: BoxFit.cover,
                              headers: const {
                                'Accept': 'image/*',
                              },
                              errorBuilder: (context, error, stackTrace) {
                                // Error handled silently
                                return Container(
                                  height: 200,
                                  padding: const EdgeInsets.all(16),
                                  color: Colors.grey[200],
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.broken_image, size: 50, color: Colors.grey),
                                        const SizedBox(height: 8),
                                        const Text(
                                          'Gagal memuat gambar',
                                          style: TextStyle(fontWeight: FontWeight.bold),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'URL: $fullUrl',
                                          style: const TextStyle(fontSize: 9, color: Colors.grey),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Error: ${error.toString()}',
                                          style: const TextStyle(fontSize: 8, color: Colors.red),
                                          textAlign: TextAlign.center,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) {
                                  debugPrint('[BuktiHistory] ✅ Image loaded successfully: $fullUrl');
                                  return child;
                                }
                                final percent = loadingProgress.expectedTotalBytes != null
                                    ? (loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes! * 100).toInt()
                                    : 0;
                                debugPrint('[BuktiHistory] ⏳ Loading image... $percent%');
                                
                                return Container(
                                  height: 200,
                                  color: Colors.grey[200],
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const CircularProgressIndicator(),
                                        const SizedBox(height: 8),
                                        Text('$percent%', style: const TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoteCard({
    required String title,
    required String content,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(fontSize: 13),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _allBukti.where((b) => b.status == 'pending').length;
    final approvedCount = _allBukti.where((b) => b.status == 'approved').length;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Riwayat Bukti Transfer',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              widget.santriName,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${_allBukti.length}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$pendingCount',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$approvedCount',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
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
                    itemBuilder: (context, index) {
                      final bukti = _filteredBukti[index];
                      return _buildBuktiCard(bukti);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    IconData icon;
    String message;
    Color color;

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
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: _loadHistory,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBuktiCard(BuktiTransfer bukti) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.1),
        child: InkWell(
          onTap: () => _showDetailDialog(bukti),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Status Badge & Date
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Status Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(bukti.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getStatusColor(bukti.status).withOpacity(0.5),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getStatusIcon(bukti.status),
                            size: 14,
                            color: _getStatusColor(bukti.status),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            bukti.statusLabel,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _getStatusColor(bukti.status),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Date
                    Text(
                      _formatDate(bukti.uploadedAt),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Jenis Transaksi
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.receipt_long,
                        size: 18,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bukti.jenisTransaksiLabel,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatCurrency(bukti.totalNominal),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),

                // Admin Note for rejected
                if (bukti.status == 'rejected' && 
                    bukti.catatanAdmin != null && 
                    bukti.catatanAdmin!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.red.withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          size: 16,
                          color: Colors.red,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            bukti.catatanAdmin!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.red,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Processed info for approved
                if (bukti.status == 'approved' && bukti.processedBy != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.verified,
                        size: 14,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Diproses oleh ${bukti.processedBy}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
