import 'package:flutter/material.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/screens/notification/notification_screen.dart';

class NotificationBellWidget extends StatefulWidget {
  final String santriId;

  const NotificationBellWidget({super.key, required this.santriId});

  @override
  State<NotificationBellWidget> createState() => _NotificationBellWidgetState();
}

class _NotificationBellWidgetState extends State<NotificationBellWidget> {
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
