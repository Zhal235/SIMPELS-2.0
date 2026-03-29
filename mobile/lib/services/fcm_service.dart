import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:simpels_mobile/utils/storage_helper.dart';
import 'package:simpels_mobile/services/api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Handling background message: ${message.messageId}');
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final ApiService _apiService = ApiService();
  String? _fcmToken;

  Future<void> initialize(BuildContext context) async {
    try {
      // Check if platform supports FCM
      if (!_isPlatformSupported()) {
        debugPrint('FCM: Platform not supported or running on web without proper config');
        return;
      }

      final notificationSettings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (notificationSettings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('FCM: User granted notification permission');
        await _setupFCM(context);
      } else if (notificationSettings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('FCM: User granted provisional notification permission');
        await _setupFCM(context);
      } else {
        debugPrint('FCM: User declined notification permission');
      }
    } catch (e) {
      debugPrint('FCM initialization error: $e');
    }
  }

  bool _isPlatformSupported() {
    // For web, check if Firebase Config is properly set
    // For mobile platforms, always supported
    return !kIsWeb || _isWebConfigured();
  }

  bool _isWebConfigured() {
    // On web, Firebase should be initialized via index.html
    // This is a placeholder - actual check would verify Firebase config
    return true;
  }

  Future<void> _setupFCM(BuildContext context) async {
    try {
      // For Web, get token with VAPID key
      if (kIsWeb) {
        _fcmToken = await _firebaseMessaging.getToken(
          vapidKey: 'BN_Lji2uXVMfD6dkPVbe95KHb3NRqOWnnGRblCylWLK3KGYK9F4RfjrIQjyoIoFAIYIk6KsLxCuApQnmoJNBWQw',
        );
      } else {
        _fcmToken = await _firebaseMessaging.getToken();
      }
      
      debugPrint('FCM Token: $_fcmToken');

      if (_fcmToken != null) {
        await _registerTokenToBackend(_fcmToken!);
      }

      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token refreshed: $newToken');
        _fcmToken = newToken;
        _registerTokenToBackend(newToken);
      });

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Foreground message received: ${message.notification?.title}');
        _handleForegroundMessage(context, message);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('Message opened app: ${message.notification?.title}');
        _handleNotificationTap(context, message);
      });

      final initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App opened from terminated state via notification');
        _handleNotificationTap(context, initialMessage);
      }
    } catch (e) {
      debugPrint('FCM setup error: $e');
    }
  }

  Future<void> _registerTokenToBackend(String token) async {
    try {
      final santriId = await StorageHelper.getActiveSantriId();
      if (santriId == null || santriId.isEmpty) {
        debugPrint('FCM: No santriId found, skipping token registration');
        return;
      }

      final response = await _apiService.registerFCMToken(santriId, token);
      if (response.statusCode == 200) {
        debugPrint('FCM: Token registered successfully to backend');
      } else {
        debugPrint('FCM: Failed to register token: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('FCM: Error registering token to backend: $e');
    }
  }

  void _handleForegroundMessage(BuildContext context, RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(notification.title ?? 'Notifikasi'),
        content: Text(notification.body ?? ''),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tutup'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _handleNotificationTap(context, message);
            },
            child: const Text('Lihat'),
          ),
        ],
      ),
    );
  }

  void _handleNotificationTap(BuildContext context, RemoteMessage message) {
    final data = message.data;
    final type = data['type'] as String?;

    switch (type) {
      case 'payment_approved':
      case 'payment_rejected':
        Navigator.pushNamed(context, '/wallet-full-history', arguments: {
          'santriId': data['santri_id'],
          'santriName': data['santri_name'] ?? 'Santri',
        });
        break;
      case 'topup_approved':
        Navigator.pushNamed(context, '/wallet-full-history', arguments: {
          'santriId': data['santri_id'],
          'santriName': data['santri_name'] ?? 'Santri',
        });
        break;
      case 'new_tagihan':
      case 'tagihan_reminder':
        break;
      case 'announcement':
        break;
      default:
        debugPrint('Unknown notification type: $type');
    }
  }

  Future<void> unregisterToken() async {
    try {
      if (_fcmToken != null) {
        final santriId = await StorageHelper.getActiveSantriId();
        if (santriId != null) {
          await _apiService.unregisterFCMToken(santriId, _fcmToken!);
        }
      }
      await _firebaseMessaging.deleteToken();
      _fcmToken = null;
      debugPrint('FCM: Token unregistered');
    } catch (e) {
      debugPrint('FCM: Error unregistering token: $e');
    }
  }

  String? get fcmToken => _fcmToken;
}
