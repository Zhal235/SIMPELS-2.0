import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/wali_model.dart';
import '../models/santri_model.dart';
import '../utils/storage_helper.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  WaliModel? _currentUser;
  List<SantriModel> _santriList = [];
  SantriModel? _activeSantri;
  bool _isLoading = false;
  String? _errorMessage;

  WaliModel? get currentUser => _currentUser;
  List<SantriModel> get santriList => _santriList;
  SantriModel? get activeSantri => _activeSantri;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;
  bool get hasMultipleSantri => _santriList.length > 1;

  // Login
  Future<Map<String, dynamic>?> login(String noHp, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.login(noHp, password);

      if (response.statusCode == 200) {
        final data = response.data;

        // Save token
        await StorageHelper.saveToken(data['token']);

        // Save wali data
        await StorageHelper.saveUser(data['wali']);

        // Set current user
        _currentUser = WaliModel.fromJson(data['wali']);

        // Parse santri list
        final List<dynamic> santriJson = data['santri'] ?? [];
        _santriList = santriJson.map((s) => SantriModel.fromJson(s)).toList();

        // Save santri list to storage
        await StorageHelper.saveSantriList(
          _santriList.map((s) => s.toJson()).toList(),
        );

        // Set active santri (default pertama atau dari storage)
        final activeSantriId = data['active_santri_id'];
        _activeSantri = _santriList.firstWhere(
          (s) => s.id == activeSantriId,
          orElse: () => _santriList.first,
        );

        // Save active santri ID
        await StorageHelper.saveActiveSantriId(_activeSantri!.id);

        // Fetch wallet info to get is_below_minimum status
        try {
          final walletRes = await _apiService.getWalletInfo(_activeSantri!.id);
          if (walletRes.statusCode == 200 && walletRes.data['success'] == true) {
            final walletData = walletRes.data['data'];
            // Update active santri with wallet info
            _activeSantri = SantriModel(
              id: _activeSantri!.id,
              nis: _activeSantri!.nis,
              nama: _activeSantri!.nama,
              jenisKelamin: _activeSantri!.jenisKelamin,
              kelas: _activeSantri!.kelas,
              asrama: _activeSantri!.asrama,
              fotoUrl: _activeSantri!.fotoUrl,
              saldoDompet: walletData['saldo'] != null ? double.parse(walletData['saldo'].toString()) : 0,
              limitHarian: walletData['limit_harian'] != null ? double.parse(walletData['limit_harian'].toString()) : null,
              minimumBalance: walletData['minimum_balance'] != null ? double.parse(walletData['minimum_balance'].toString()) : null,
              isBelowMinimum: walletData['is_below_minimum'] == true || walletData['is_below_minimum'] == 1,
              hubungan: _activeSantri!.hubungan,
              namaWali: _activeSantri!.namaWali,
            );
          }
        } catch (e) {
          debugPrint('Failed to fetch wallet info on login: $e');
        }

        _isLoading = false;
        notifyListeners();
        return data; // Return data untuk cek jumlah santri
      }

      _errorMessage = 'Login gagal';
      _isLoading = false;
      notifyListeners();
      return null;
    } catch (e) {
      _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Switch active santri
  Future<void> switchSantri(String santriId) async {
    _activeSantri = _santriList.firstWhere((s) => s.id == santriId);
    await StorageHelper.saveActiveSantriId(santriId);
    
    // Fetch wallet info to get latest balance and is_below_minimum status
    try {
      final walletRes = await _apiService.getWalletInfo(santriId);
      if (walletRes.statusCode == 200 && walletRes.data['success'] == true) {
        final walletData = walletRes.data['data'];
        // Update active santri with wallet info
        _activeSantri = SantriModel(
          id: _activeSantri!.id,
          nis: _activeSantri!.nis,
          nama: _activeSantri!.nama,
          jenisKelamin: _activeSantri!.jenisKelamin,
          kelas: _activeSantri!.kelas,
          asrama: _activeSantri!.asrama,
          fotoUrl: _activeSantri!.fotoUrl,
          saldoDompet: walletData['saldo'] != null ? double.parse(walletData['saldo'].toString()) : 0,
          limitHarian: walletData['limit_harian'] != null ? double.parse(walletData['limit_harian'].toString()) : null,
          minimumBalance: walletData['minimum_balance'] != null ? double.parse(walletData['minimum_balance'].toString()) : null,
          isBelowMinimum: walletData['is_below_minimum'] == true || walletData['is_below_minimum'] == 1,
          hubungan: _activeSantri!.hubungan,
          namaWali: _activeSantri!.namaWali,
        );
      }
    } catch (e) {
      // Ignore wallet fetch error
      debugPrint('Failed to fetch wallet info: $e');
    }
    
    notifyListeners();
  }

  // Refresh data from API
  Future<void> refreshData() async {
    if (_currentUser == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      // Re-login to get fresh data
      final response = await _apiService.login(
        _currentUser!.noHp,
        '123456', // default password
      );

      if (response.statusCode == 200) {
        final data = response.data;

        // Update santri list
        final List<dynamic> santriJson = data['santri'] ?? [];
        _santriList = santriJson.map((s) => SantriModel.fromJson(s)).toList();

        // Save to storage
        await StorageHelper.saveSantriList(
          _santriList.map((s) => s.toJson()).toList(),
        );

        // Update active santri with fresh data and fetch wallet info
        final currentActiveSantriId = _activeSantri?.id;
        if (currentActiveSantriId != null) {
          _activeSantri = _santriList.firstWhere(
            (s) => s.id == currentActiveSantriId,
            orElse: () => _santriList.first,
          );
          
          // Fetch wallet info to get is_below_minimum status
          try {
            final walletRes = await _apiService.getWalletInfo(_activeSantri!.id);
            if (walletRes.statusCode == 200 && walletRes.data['success'] == true) {
              final walletData = walletRes.data['data'];
              // Update active santri with wallet info
              _activeSantri = SantriModel(
                id: _activeSantri!.id,
                nis: _activeSantri!.nis,
                nama: _activeSantri!.nama,
                jenisKelamin: _activeSantri!.jenisKelamin,
                kelas: _activeSantri!.kelas,
                asrama: _activeSantri!.asrama,
                fotoUrl: _activeSantri!.fotoUrl,
                saldoDompet: walletData['saldo'] != null ? double.parse(walletData['saldo'].toString()) : 0,
                limitHarian: walletData['limit_harian'] != null ? double.parse(walletData['limit_harian'].toString()) : null,
                minimumBalance: walletData['minimum_balance'] != null ? double.parse(walletData['minimum_balance'].toString()) : null,
                isBelowMinimum: walletData['is_below_minimum'] == true || walletData['is_below_minimum'] == 1,
                hubungan: _activeSantri!.hubungan,
                namaWali: _activeSantri!.namaWali,
              );
            }
          } catch (e) {
            // Ignore wallet fetch error
            debugPrint('Failed to fetch wallet info: $e');
          }
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout
  Future<void> logout() async {
    await StorageHelper.clearAll();
    _currentUser = null;
    _santriList = [];
    _activeSantri = null;
    notifyListeners();
  }

  // Check if already logged in
  Future<void> checkLoginStatus() async {
    final isLoggedIn = await StorageHelper.isLoggedIn();
    if (isLoggedIn) {
      final userData = await StorageHelper.getUser();
      if (userData != null) {
        _currentUser = WaliModel.fromJson(userData);

        // Restore santri list
        final santriData = await StorageHelper.getSantriList();
        if (santriData != null) {
          _santriList = santriData.map((s) => SantriModel.fromJson(s)).toList();

          // Restore active santri
          final activeSantriId = await StorageHelper.getActiveSantriId();
          if (activeSantriId != null) {
            _activeSantri = _santriList.firstWhere(
              (s) => s.id == activeSantriId,
              orElse: () => _santriList.first,
            );
          }
        }

        notifyListeners();
      }
    }
  }
}
