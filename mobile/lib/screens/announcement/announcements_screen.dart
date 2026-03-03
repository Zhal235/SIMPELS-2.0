import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:simpels_mobile/models/announcement.dart';
import 'package:simpels_mobile/services/announcement_service.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/utils/storage_helper.dart';
import 'package:simpels_mobile/widgets/announcement/announcement_list.dart';
import 'package:simpels_mobile/widgets/announcement/announcement_detail_sheet.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late AnnouncementService _announcementService;

  List<Announcement> _allAnnouncements = [];
  List<Announcement> _unreadAnnouncements = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _unreadCount = 0;

  String _formatDateTime(DateTime dateTime, {bool shortFormat = false}) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    final day = dateTime.day.toString().padLeft(2, '0');
    final month = shortFormat ? months[dateTime.month - 1] : monthsFull[dateTime.month - 1];
    final year = dateTime.year;
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$day $month $year, $hour:$minute';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    await _initService();
    await _loadAnnouncements();
  }

  Future<void> _initService() async {
    final baseUrl = ApiService.getBaseUrl();
    final token = await StorageHelper.getToken();
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    ));
    _announcementService = AnnouncementService(dio);
  }

  Future<void> _loadAnnouncements() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final allResult = await _announcementService.getAnnouncements(unreadOnly: false, limit: 100);
      final unreadResult = await _announcementService.getAnnouncements(unreadOnly: true, limit: 100);

      if (allResult['success'] == true) {
        setState(() {
          _allAnnouncements = allResult['data'] as List<Announcement>;
          _unreadAnnouncements = unreadResult['data'] as List<Announcement>;
          _unreadCount = allResult['unread_count'] as int? ?? 0;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = allResult['message'] as String?;
          _isLoading = false;
        });
      }
    } catch (e) {
      final errorString = e.toString();
      if ((errorString.contains('401') || errorString.contains('Unauthorized')) && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sesi Anda telah berakhir. Silakan login kembali.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
      setState(() {
        _errorMessage = errorString.contains('401')
            ? 'Sesi berakhir. Silakan logout dan login kembali.'
            : 'Terjadi kesalahan: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(Announcement announcement) async {
    if (announcement.isRead) return;
    try {
      final result = await _announcementService.markAsRead(announcement.id);
      if (result['success'] == true) await _loadAnnouncements();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menandai sebagai dibaca: $e')),
        );
      }
    }
  }

  void _showAnnouncementDetail(Announcement announcement) {
    _markAsRead(announcement);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AnnouncementDetailSheet(
        announcement: announcement,
        formatDateTime: _formatDateTime,
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Pengumuman', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.primary.withOpacity(0.8),
              ],
            ),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: Theme.of(context).colorScheme.primary,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: Theme.of(context).colorScheme.primary,
              indicatorWeight: 3,
              tabs: [
                Tab(child: _buildTabLabel('Semua', _allAnnouncements.length, isCount: true)),
                Tab(child: _buildTabLabel('Belum Dibaca', _unreadCount, isUnread: true)),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          AnnouncementList(
            announcements: _allAnnouncements,
            isLoading: _isLoading,
            errorMessage: _errorMessage,
            onRefresh: _loadAnnouncements,
            onTap: _showAnnouncementDetail,
            formatDateTime: _formatDateTime,
          ),
          AnnouncementList(
            announcements: _unreadAnnouncements,
            isLoading: _isLoading,
            errorMessage: _errorMessage,
            onRefresh: _loadAnnouncements,
            onTap: _showAnnouncementDetail,
            formatDateTime: _formatDateTime,
          ),
        ],
      ),
    );
  }

  Widget _buildTabLabel(String label, int count, {bool isCount = false, bool isUnread = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        if (count > 0)
          Container(
            margin: const EdgeInsets.only(left: 8),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              gradient: isUnread
                  ? const LinearGradient(colors: [Colors.red, Colors.redAccent])
                  : null,
              color: isCount ? Colors.grey[300] : null,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isUnread ? Colors.white : null,
              ),
            ),
          ),
      ],
    );
  }
}
