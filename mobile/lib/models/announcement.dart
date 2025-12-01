class Announcement {
  final int id;
  final String title;
  final String content;
  final String priority; // 'normal', 'important', 'urgent'
  final String targetType; // 'all', 'class', 'santri'
  final List<int>? targetIds;
  final bool pushNotification;
  final String? createdBy;
  final DateTime createdAt;
  final bool isRead;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.priority,
    required this.targetType,
    this.targetIds,
    required this.pushNotification,
    this.createdBy,
    required this.createdAt,
    required this.isRead,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as int,
      title: json['title'] as String,
      content: json['content'] as String,
      priority: json['priority'] as String,
      targetType: json['target_type'] as String,
      targetIds: json['target_ids'] != null
          ? List<int>.from(json['target_ids'] as List)
          : null,
      pushNotification: json['push_notification'] as bool? ?? false,
      createdBy: json['created_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'priority': priority,
      'target_type': targetType,
      'target_ids': targetIds,
      'push_notification': pushNotification,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
    };
  }

  String get priorityLabel {
    switch (priority) {
      case 'urgent':
        return 'Mendesak';
      case 'important':
        return 'Penting';
      case 'normal':
      default:
        return 'Normal';
    }
  }

  String get priorityIcon {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'important':
        return '🟠';
      case 'normal':
      default:
        return '🔵';
    }
  }

  Announcement copyWith({
    int? id,
    String? title,
    String? content,
    String? priority,
    String? targetType,
    List<int>? targetIds,
    bool? pushNotification,
    String? createdBy,
    DateTime? createdAt,
    bool? isRead,
  }) {
    return Announcement(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      priority: priority ?? this.priority,
      targetType: targetType ?? this.targetType,
      targetIds: targetIds ?? this.targetIds,
      pushNotification: pushNotification ?? this.pushNotification,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
    );
  }
}
