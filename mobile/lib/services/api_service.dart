import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
// typed data provided by foundation import
import '../config/app_config.dart';
import '../utils/storage_helper.dart';

class ApiService {
  late Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
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

  Future<Response> getWaliWallet(int santriId) async {
    return await _dio.get('${AppConfig.waliWalletEndpoint}/$santriId');
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
    
    // Add array items individually with [] notation for Laravel
    for (int i = 0; i < tagihanIds.length; i++) {
      formFields['tagihan_ids[$i]'] = tagihanIds[i].toString();
    }
    
    final formData = FormData.fromMap(formFields);

    debugPrint('[API] Uploading bukti to: /wali/upload-bukti/$santriId');
    debugPrint('[API] Tagihan IDs: $tagihanIds');
    debugPrint('[API] Total: $totalNominal');

    return await _dio.post(
      '/wali/upload-bukti/$santriId',
      data: formData,
    );
  }

  Future<Response> getBuktiHistory(String santriId) async {
    return await _dio.get('/wali/bukti-history/$santriId');
  }
}
