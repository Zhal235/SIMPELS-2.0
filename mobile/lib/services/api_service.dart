import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
// typed data provided by foundation import
import '../config/app_config.dart';
import '../utils/storage_helper.dart';

class ApiService {
  late Dio _dio;

  /// Get base URL based on platform
  static String getBaseUrl() {
    // For web, always use localhost
    if (kIsWeb) {
      return 'http://localhost:8001';
    }
    
    // For Android emulator
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8001';
    }
    
    // For iOS simulator or other platforms
    return 'http://localhost:8001';
  }

  /// Convert relative storage URL to full URL
  static String getFullImageUrl(String? relativePath) {
    if (relativePath == null || relativePath.isEmpty) return '';
    
    // If already full URL with localhost, convert to platform-specific URL
    if (relativePath.startsWith('http://localhost:') || relativePath.startsWith('http://127.0.0.1:')) {
      final baseUrl = getBaseUrl();
      // Extract path after domain:port
      final uri = Uri.parse(relativePath);
      final path = uri.path.startsWith('/') ? uri.path.substring(1) : uri.path;
      return '$baseUrl/$path';
    }
    
    // If already full URL with correct domain, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Get base URL without /api suffix
    final baseUrl = getBaseUrl();
    
    // Remove leading slash if present to avoid double slashes
    final cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    
    return '$baseUrl/$cleanPath';
  }

  ApiService() {
    final baseUrl = getBaseUrl();
    _dio = Dio(BaseOptions(
      baseUrl: '$baseUrl/api',
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      responseType: ResponseType.json,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptor for auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageHelper.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
          debugPrint('[API] Request to: ${options.path} with token');
        } else {
          debugPrint('[API] WARNING: Request to ${options.path} without token!');
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized
        if (error.response?.statusCode == 401) {
          debugPrint('[API] 401 Unauthorized - Clearing session');
          // Clear all storage to force re-login
          await StorageHelper.clearAll();
        }
        return handler.next(error);
      },
    ));
  }

  // Auth
  Future<Response> login(String noHp, String password) async {
    return await _dio.post(AppConfig.loginEndpoint, data: {
      'no_hp': noHp,
      'password': password,
    });
  }

  // Wali Santri
  Future<Response> getWaliSantri() async {
    return await _dio.get(AppConfig.waliSantriEndpoint);
  }

  Future<Response> getWaliWallet(String santriId) async {
    return await _dio.get('${AppConfig.waliWalletEndpoint}/$santriId');
  }

  /// Get wallet transactions (full history) using admin-style endpoint
  Future<Response> getWalletTransactions(String santriId, {int page = 1, int limit = 50}) async {
    return await _dio.get('/v1/wallets/$santriId/transactions', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Response> getWaliPembayaran(int santriId) async {
    return await _dio.get('${AppConfig.waliPembayaranEndpoint}/$santriId');
  }

  Future<Response> getWaliTunggakan(int santriId) async {
    return await _dio.get('${AppConfig.waliTunggakanEndpoint}/$santriId');
  }

  Future<Response> getAllTagihan(String santriId) async {
    try {
      final response = await _dio.get('${AppConfig.waliTagihanEndpoint}/$santriId');
      debugPrint('getAllTagihan raw response: ${response.data.runtimeType}');
      return response;
    } catch (e) {
      debugPrint('getAllTagihan error: $e');
      rethrow;
    }
  }

  Future<Response> submitPayment({
    required String santriId,
    required String tagihanId,
    required double amount,
    required File buktiFile,
    required String metode,
  }) async {
    final formData = FormData.fromMap({
      'tagihan_id': tagihanId,
      'amount': amount,
      'metode': metode,
      'bukti': await MultipartFile.fromFile(
        buktiFile.path,
        filename: 'bukti_transfer_${DateTime.now().millisecondsSinceEpoch}.jpg',
      ),
    });

    return await _dio.post(
      '/wali/bayar/$santriId',
      data: formData,
    );
  }

  Future<Response> uploadBuktiTransfer({
    required String santriId,
    required List<int> tagihanIds,
    required double totalNominal,
    File? buktiFile,
    Uint8List? buktiBytes,
    String? catatan,
    double? nominalTopup,
    int? selectedBankId,
  }) async {
    MultipartFile multipartFile;
    
    if (buktiBytes != null) {
      // For web platform
      multipartFile = MultipartFile.fromBytes(
        buktiBytes,
        filename: 'bukti_transfer_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
    } else if (buktiFile != null) {
      // For mobile platform
      multipartFile = await MultipartFile.fromFile(
        buktiFile.path,
        filename: 'bukti_transfer_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
    } else {
      throw Exception('No file provided');
    }

    // Build form data with proper array format for Laravel
    final Map<String, dynamic> formFields = {
      'total_nominal': totalNominal.toString(),
      'catatan': catatan ?? '',
      'bukti': multipartFile,
    };
    
    // Add selected bank ID if provided
    if (selectedBankId != null) {
      formFields['selected_bank_id'] = selectedBankId.toString();
    }
    
    // Add topup nominal if provided
    if (nominalTopup != null && nominalTopup > 0) {
      formFields['nominal_topup'] = nominalTopup.toString();
    }
    
    // Add array items individually with [] notation for Laravel
    for (int i = 0; i < tagihanIds.length; i++) {
      formFields['tagihan_ids[$i]'] = tagihanIds[i].toString();
    }
    
    final formData = FormData.fromMap(formFields);

    debugPrint('[API] Uploading bukti to: /wali/upload-bukti/$santriId');
    debugPrint('[API] Tagihan IDs: $tagihanIds');
    debugPrint('[API] Total: $totalNominal');
    if (nominalTopup != null) debugPrint('[API] Topup: $nominalTopup');

    return await _dio.post(
      '/wali/upload-bukti/$santriId',
      data: formData,
    );
  }

  Future<Response> getBuktiHistory(String santriId) async {
    return await _dio.get('/wali/bukti-history/$santriId');
  }

  /// Get notifications for santri
  Future<Response> getNotifications(String santriId) async {
    return await _dio.get('/wali/notifications/$santriId');
  }

  /// Get unread notification count
  Future<Response> getUnreadNotificationCount(String santriId) async {
    return await _dio.get('/wali/notifications/$santriId/unread-count');
  }

  /// Mark notification as read
  Future<Response> markNotificationAsRead(int notificationId) async {
    return await _dio.post('/wali/notifications/$notificationId/read');
  }

  /// Mark all notifications as read
  Future<Response> markAllNotificationsAsRead(String santriId) async {
    return await _dio.post('/wali/notifications/$santriId/read-all');
  }

  /// Topup wallet (admin or authorized user) via v1 wallets endpoint
  Future<Response> topupWallet(String santriId, double amount, {String? method, String? description}) async {
    final payload = {
      'amount': amount,
      if (method != null) 'method': method,
      if (description != null) 'description': description,
    };

    return await _dio.post('/v1/wallets/$santriId/topup', data: payload);
  }

  /// Allow wali to set per-santri daily limit (calling /wali route added)
  Future<Response> setSantriDailyLimit(String santriId, double dailyLimit) async {
    return await _dio.put('${AppConfig.waliWalletEndpoint}/$santriId/limit', data: {
      'daily_limit': dailyLimit,
    });
  }

  /// Upload bukti transfer untuk top-up dompet
  Future<Response> uploadBuktiTopup({
    required String santriId,
    required double nominal,
    File? buktiFile,
    Uint8List? buktiBytes,
    String? catatan,
    int? selectedBankId,
  }) async {
    MultipartFile multipartFile;
    
    if (buktiBytes != null) {
      // For web platform
      multipartFile = MultipartFile.fromBytes(
        buktiBytes,
        filename: 'bukti_topup_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
    } else if (buktiFile != null) {
      // For mobile platform
      multipartFile = await MultipartFile.fromFile(
        buktiFile.path,
        filename: 'bukti_topup_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
    } else {
      throw Exception('No file provided');
    }

    final Map<String, dynamic> formFields = {
      'nominal': nominal.toString(),
      'catatan': catatan ?? '',
      'bukti': multipartFile,
    };

    // Add selected bank ID if provided
    if (selectedBankId != null) {
      formFields['selected_bank_id'] = selectedBankId.toString();
    }

    final formData = FormData.fromMap(formFields);

    debugPrint('[API] Uploading bukti topup to: /wali/upload-bukti-topup/$santriId');
    debugPrint('[API] Nominal: $nominal');

    return await _dio.post(
      '/wali/upload-bukti-topup/$santriId',
      data: formData,
    );
  }

  /// Get list of active bank accounts for payment
  Future<Response> getBankAccounts() async {
    return await _dio.get('/wali/bank-accounts');
  }

  /// Change password for wali (mobile app)
  Future<Response> changePassword({
    required String noHp,
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    return await _dio.post('/wali/change-password', data: {
      'no_hp': noHp,
      'current_password': currentPassword,
      'new_password': newPassword,
      'new_password_confirmation': newPasswordConfirmation,
    });
  }

  /// Get detailed santri data
  Future<Response> getSantriDetail(String santriId) async {
    return await _dio.get('/wali/santri/$santriId/detail');
  }

  /// Submit data correction request
  Future<Response> submitDataCorrection({
    required String santriId,
    required String fieldName,
    required String oldValue,
    required String newValue,
    required String note,
  }) async {
    return await _dio.post('/wali/santri/$santriId/correction', data: {
      'field_name': fieldName,
      'old_value': oldValue,
      'new_value': newValue,
      'note': note,
    });
  }
}
