import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/announcement_service.dart';
import '../services/api_service.dart';
import '../utils/storage_helper.dart';
import '../models/announcement.dart';
import '../screens/announcements_screen.dart';

class DashboardAnnouncementCard extends StatefulWidget {
  const DashboardAnnouncementCard({super.key});

  @override
  State<DashboardAnnouncementCard> createState() => _DashboardAnnouncementCardState();
}

class _DashboardAnnouncementCardState extends State<DashboardAnnouncementCard> {
  late AnnouncementService _announcementService;
  Announcement? _latestAnnouncement;
  int _unreadCount = 0;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    await _initService();
    await _loadData();
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

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get latest announcements (limit 1 is enough for display, but we need unread count too)
      final result = await _announcementService.getAnnouncements(limit: 5);

      if (mounted) {
        if (result['success'] == true) {
          final List<Announcement> list = result['data'] ?? [];
          setState(() {
            _latestAnnouncement = list.isNotEmpty ? list.first : null;
            _unreadCount = result['unread_count'] ?? 0;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = result['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Gagal memuat pengumuman';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pengumuman Terbaru',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const AnnouncementsScreen(),
                    ),
                  ).then((_) => _loadData()); // Reload when coming back
                },
                child: const Text('Lihat Semua'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildContent(),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return Container(
        height: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red[50],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red),
            const SizedBox(width: 8),
            Expanded(child: Text(_error!, style: TextStyle(color: Colors.red[700]))),
          ],
        ),
      );
    }

    if (_latestAnnouncement == null) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.notifications_none, size: 48, color: Colors.grey[300]),
              const SizedBox(height: 8),
              Text(
                'Tidak ada pengumuman',
                style: TextStyle(color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }

    final announcement = _latestAnnouncement!;
    final bool isUnread = !_latestAnnouncement!.isRead;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const AnnouncementsScreen(),
          ),
        ).then((_) => _loadData());
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: isUnread ? Border.all(color: Colors.red[200]!, width: 1.5) : null,
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _getPriorityColor(announcement.priority).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getPriorityIcon(announcement.priority),
                      color: _getPriorityColor(announcement.priority),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (isUnread)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'BARU',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            Expanded(
                              child: Text(
                                announcement.title,
                                style: TextStyle(
                                  fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                                  fontSize: 15,
                                  color: Colors.grey[900],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          announcement.content,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 13,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _formatDate(announcement.createdAt),
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return Colors.red;
      case 'important':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority) {
      case 'urgent':
        return Icons.campaign;
      case 'important':
        return Icons.info;
      default:
        return Icons.article;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Hari ini';
    } else if (diff.inDays == 1) {
      return 'Kemarin';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} hari yang lalu';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
