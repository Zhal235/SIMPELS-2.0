class AppConfig {
  // API Configuration - Development Mode
  // Use local backend server for all platforms during development
  // IMPORTANT: Do NOT include /api here because ApiService handles paths differently
  // or checks environment.
  // Actually, ApiService.dart seems to append /api already in some cases?
  // Let's reset this to simple base URL without api/v1 suffix to avoid duplication issues
  // and let ApiService handle the path construction correctly.
  
  // Checking ApiService.dart...
  // It says: _dio = Dio(BaseOptions(baseUrl: baseUrl, ...))
  // And baseUrl comes from getBaseUrl() which returns AppConfig.apiBaseUrl
  
  // But wait, the previous errors showed: :8001/api/v1/api/wali/announcements
  // That means:
  // BaseURL = http://localhost:8001/api/v1
  // Endpoint requested = /api/wali/announcements (maybe?)
  
  static const String apiBaseUrl = 'http://localhost:8001/api/v1';

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
