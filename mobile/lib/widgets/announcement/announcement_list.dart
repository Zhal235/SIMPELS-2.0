import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/announcement.dart';
import 'package:simpels_mobile/widgets/announcement/priority_chip.dart';

class AnnouncementList extends StatelessWidget {
  final List<Announcement> announcements;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRefresh;
  final void Function(Announcement) onTap;
  final String Function(DateTime, {bool shortFormat}) formatDateTime;

  const AnnouncementList({
    super.key,
    required this.announcements,
    required this.isLoading,
    required this.errorMessage,
    required this.onRefresh,
    required this.onTap,
    required this.formatDateTime,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(errorMessage!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRefresh, child: const Text('Coba Lagi')),
          ],
        ),
      );
    }

    if (announcements.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('Belum ada pengumuman', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: Theme.of(context).colorScheme.primary,
      child: ListView.builder(
        itemCount: announcements.length,
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemBuilder: (context, index) {
          final announcement = announcements[index];
          return _AnnouncementCard(
            announcement: announcement,
            onTap: () => onTap(announcement),
            formatDateTime: formatDateTime,
          );
        },
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Announcement announcement;
  final VoidCallback onTap;
  final String Function(DateTime, {bool shortFormat}) formatDateTime;

  const _AnnouncementCard({
    required this.announcement,
    required this.onTap,
    required this.formatDateTime,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: announcement.isRead
            ? null
            : LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [const Color(0xFFEFF6FF), Colors.blue[50]!],
              ),
        boxShadow: [
          BoxShadow(
            color: announcement.isRead ? Colors.black.withOpacity(0.05) : Colors.blue.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: announcement.isRead ? Colors.white : Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: announcement.isRead ? Colors.grey[200]! : const Color(0xFF3B82F6),
                width: announcement.isRead ? 1 : 2,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: priorityGradientColors(announcement.priority),
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: priorityColor(announcement.priority).withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(announcement.priorityIcon, style: const TextStyle(fontSize: 28)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              announcement.title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: announcement.isRead ? FontWeight.w600 : FontWeight.bold,
                                color: Colors.grey[900],
                                height: 1.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (!announcement.isRead) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF2563EB)]),
                                shape: BoxShape.circle,
                                boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.4), blurRadius: 4, offset: const Offset(0, 2))],
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        announcement.content,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600], height: 1.4),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                                const SizedBox(width: 4),
                                Text(
                                  formatDateTime(announcement.createdAt, shortFormat: true),
                                  style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey[400]),
                        ],
                      ),
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
}
