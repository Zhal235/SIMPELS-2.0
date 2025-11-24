import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../utils/storage_helper.dart';

class ApiService {
  late Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptor for auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageHelper.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Handle 401 Unauthorized
        if (error.response?.statusCode == 401) {
          StorageHelper.clearAll();
        }
        return handler.next(error);
      },
    ));
  }

  // Auth
  Future<Response> login(String email, String password) async {
    return await _dio.post(AppConfig.loginEndpoint, data: {
      'email': email,
      'password': password,
    });
  }

  // Wali Santri
  Future<Response> getWaliSantri() async {
    return await _dio.get(AppConfig.waliSantriEndpoint);
  }

  Future<Response> getWaliWallet(int santriId) async {
    return await _dio.get('${AppConfig.waliWalletEndpoint}/$santriId');
  }

  Future<Response> getWaliPembayaran(int santriId) async {
    return await _dio.get('${AppConfig.waliPembayaranEndpoint}/$santriId');
  }

  Future<Response> getWaliTunggakan(int santriId) async {
    return await _dio.get('${AppConfig.waliTunggakanEndpoint}/$santriId');
  }
}
