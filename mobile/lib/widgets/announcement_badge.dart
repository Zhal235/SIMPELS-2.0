import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/announcement_service.dart';
import '../services/api_service.dart';
import '../utils/storage_helper.dart';
import '../screens/announcements_screen.dart';

class AnnouncementBadge extends StatefulWidget {
  const AnnouncementBadge({super.key});

  @override
  State<AnnouncementBadge> createState() => _AnnouncementBadgeState();
}

class _AnnouncementBadgeState extends State<AnnouncementBadge> {
  late AnnouncementService _announcementService;
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _initialized = false;
  DateTime? _lastFetch;

  @override
  void initState() {
    super.initState();
    _initService();
  }

  Future<void> _initService() async {
    final token = await StorageHelper.getToken();
    
    // Jangan load jika belum login
    if (token == null) {
      _initialized = true;
      return;
    }

    final baseUrl = ApiService.getBaseUrl();
    final dio = Dio(BaseOptions(
      baseUrl: '$baseUrl/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    ));

    _announcementService = AnnouncementService(dio);
    _initialized = true;
    
    // Load unread count setelah init
    _loadUnreadCount();
  }

  Future<void> _loadUnreadCount() async {
    if (!_initialized || _isLoading) return;
    
    // Debounce: jangan fetch jika baru fetch < 5 detik yang lalu
    if (_lastFetch != null && 
        DateTime.now().difference(_lastFetch!) < const Duration(seconds: 5)) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _announcementService.getUnreadCount();

      if (result['success'] == true && mounted) {
        setState(() {
          _unreadCount = result['count'] as int? ?? 0;
          _isLoading = false;
          _lastFetch = DateTime.now();
        });
      } else {
        setState(() {
          _isLoading = false;
          _lastFetch = DateTime.now();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _lastFetch = DateTime.now();
        });
      }
    }
  }

  void _openAnnouncements() async {
    // Navigate to announcements screen
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AnnouncementsScreen(),
      ),
    );

    // Refresh count after returning
    _loadUnreadCount();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: const Icon(Icons.campaign_outlined),
          onPressed: _openAnnouncements,
          tooltip: 'Pengumuman',
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
                _unreadCount > 99 ? '99+' : '$_unreadCount',
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
