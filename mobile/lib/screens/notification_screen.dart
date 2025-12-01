import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/notification.dart' as app_notif;

class NotificationScreen extends StatefulWidget {
  final String santriId;

  const NotificationScreen({super.key, required this.santriId});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ApiService _api = ApiService();
  List<app_notif.Notification> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getNotifications(widget.santriId);
      if (res.statusCode == 200 && res.data['success'] == true) {
        final List<dynamic> data = res.data['data'] ?? [];
        setState(() {
          _notifications = data
              .map((json) => app_notif.Notification.fromJson(json))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading notifications: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(int notificationId) async {
    try {
      await _api.markNotificationAsRead(notificationId);
      _loadNotifications(); // Reload to update UI
    } catch (e) {
      debugPrint('Error marking as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _api.markAllNotificationsAsRead(widget.santriId);
      _loadNotifications(); // Reload to update UI
    } catch (e) {
      debugPrint('Error marking all as read: $e');
    }
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'payment_approved':
        return Icons.check_circle;
      case 'payment_rejected':
        return Icons.cancel;
      case 'topup_approved':
        return Icons.account_balance_wallet;
      case 'new_tagihan':
        return Icons.receipt_long;
      case 'tagihan_reminder':
        return Icons.alarm;
      default:
        return Icons.notifications;
    }
  }

  Color _getColor(String type) {
    switch (type) {
      case 'payment_approved':
      case 'topup_approved':
        return Colors.green;
      case 'payment_rejected':
        return Colors.red;
      case 'new_tagihan':
        return Colors.blue;
      case 'tagihan_reminder':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_notifications.any((n) => !n.isRead))
            TextButton.icon(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all, color: Colors.white, size: 20),
              label: const Text(
                'Tandai Semua',
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _notifications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none,
                            size: 80, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          'Tidak ada notifikasi',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final notif = _notifications[index];
                      return Card(
                        color:
                            notif.isRead ? Colors.white : Colors.blue.shade50,
                        elevation: notif.isRead ? 1 : 3,
                        child: InkWell(
                          onTap: () {
                            if (!notif.isRead) {
                              _markAsRead(notif.id);
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color:
                                        _getColor(notif.type).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    _getIcon(notif.type),
                                    color: _getColor(notif.type),
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              notif.title,
                                              style: TextStyle(
                                                fontWeight: notif.isRead
                                                    ? FontWeight.w600
                                                    : FontWeight.bold,
                                                fontSize: 15,
                                              ),
                                            ),
                                          ),
                                          if (!notif.isRead)
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: Colors.blue,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        notif.message,
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[700],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        notif.timeAgo,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[500],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
