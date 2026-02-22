import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration - Environment-based URL
  // Automatically switches between development (localhost) and production (api-simpels.saza.sch.id)
  
  static String get apiBaseUrl {
    if (kDebugMode) {
      // Development mode - use localhost
      return 'http://localhost:8001/api/v1';
    } else {
      // Production mode - use production API
      return 'https://api-simpels.saza.sch.id/api/v1';
    }
  }

  // Endpoints
  // Note: These should be relative to apiBaseUrl
  static const String loginEndpoint = '/auth/login';
  static const String waliSantriEndpoint = '/wali/santri';
  static const String waliWalletEndpoint = '/wali/wallet';
  static const String waliPembayaranEndpoint = '/wali/pembayaran';
  static const String waliTunggakanEndpoint = '/wali/tunggakan';
  static const String waliTagihanEndpoint = '/wali/tagihan';

  // App Info
  static const String appName = 'SIMPELS Mobile';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
