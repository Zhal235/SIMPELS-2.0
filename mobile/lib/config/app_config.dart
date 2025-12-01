class AppConfig {
  // API Configuration
  // For Web: use localhost
  // For Android emulator: use 10.0.2.2
  // For physical device: use your computer's IP address (e.g., 192.168.1.100)
  static const String apiBaseUrl = 'http://localhost:8001/api';

  // Endpoints
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
