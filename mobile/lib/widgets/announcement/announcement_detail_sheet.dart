import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/announcement.dart';
import 'package:simpels_mobile/widgets/announcement/priority_chip.dart';

class AnnouncementDetailSheet extends StatelessWidget {
  final Announcement announcement;
  final String Function(DateTime, {bool shortFormat}) formatDateTime;

  const AnnouncementDetailSheet({
    super.key,
    required this.announcement,
    required this.formatDateTime,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, -5)),
          ],
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 5,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(3)),
            ),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.all(24),
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 20),
                  _buildMetadata(context),
                  const SizedBox(height: 24),
                  _buildContent(),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: priorityDetailGradient(announcement.priority),
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: priorityColor(announcement.priority).withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Text(announcement.priorityIcon, style: const TextStyle(fontSize: 36)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  announcement.title,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.3),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    PriorityChip(priority: announcement.priority),
                    if (announcement.pushNotification)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.notifications_active, size: 14, color: Colors.white),
                            SizedBox(width: 4),
                            Text('Push', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetadata(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today, size: 18, color: Colors.grey[600]),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  formatDateTime(announcement.createdAt),
                  style: TextStyle(color: Colors.grey[700], fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          if (announcement.createdBy != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.person_outline, size: 18, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    announcement.createdBy!,
                    style: TextStyle(color: Colors.grey[700], fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.article_outlined, size: 20, color: Colors.grey[700]),
              const SizedBox(width: 8),
              Text(
                'Isi Pengumuman',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey[700]),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(announcement.content, style: const TextStyle(fontSize: 16, height: 1.7, color: Colors.black87)),
        ],
      ),
    );
  }
}
