import 'package:dio/dio.dart';
import '../models/announcement.dart';

class AnnouncementService {
  final Dio _dio;

  AnnouncementService(this._dio);

  /// Get list of announcements
  /// [unreadOnly] - If true, only fetch unread announcements
  /// [limit] - Maximum number of announcements to fetch
  Future<Map<String, dynamic>> getAnnouncements({
    bool unreadOnly = false,
    int limit = 50,
  }) async {
    try {
      // Endpoint: /wali/announcements (will be prefixed with /api/v1 by baseUrl)
      final response = await _dio.get(
        '/wali/announcements',
        queryParameters: {
          'unread_only': unreadOnly,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        final List<dynamic> dataList = response.data['data'] ?? [];
        final announcements = dataList
            .map((json) => Announcement.fromJson(json as Map<String, dynamic>))
            .toList();

        return {
          'success': true,
          'data': announcements,
          'unread_count': response.data['unread_count'] ?? 0,
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Gagal memuat pengumuman',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Terjadi kesalahan',
      };
    }
  }

  /// Get unread count for badge
  Future<Map<String, dynamic>> getUnreadCount() async {
    try {
      final response = await _dio.get('/wali/announcements/unread-count');

      if (response.data['success'] == true) {
        return {
          'success': true,
          'count': response.data['count'] ?? 0,
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Gagal memuat jumlah unread',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Terjadi kesalahan',
      };
    }
  }

  /// Get single announcement by ID
  Future<Map<String, dynamic>> getAnnouncement(int id) async {
    try {
      final response = await _dio.get('/wali/announcements/$id');

      if (response.data['success'] == true) {
        final announcement = Announcement.fromJson(
          response.data['data'] as Map<String, dynamic>,
        );

        return {
          'success': true,
          'data': announcement,
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Pengumuman tidak ditemukan',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Terjadi kesalahan',
      };
    }
  }

  /// Mark announcement as read
  Future<Map<String, dynamic>> markAsRead(int id) async {
    try {
      final response = await _dio.post('/wali/announcements/$id/mark-read');

      if (response.data['success'] == true) {
        return {
          'success': true,
          'message':
              response.data['message'] ?? 'Pengumuman ditandai sebagai dibaca',
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Gagal menandai sebagai dibaca',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Terjadi kesalahan',
      };
    }
  }
}
