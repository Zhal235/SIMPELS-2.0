import 'package:flutter/foundation.dart';
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
    notifyListeners();
    // Data sudah ada di _santriList, tidak perlu refresh lagi
    // UI akan auto-update karena notifyListeners()
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

        // Update active santri with fresh data
        final currentActiveSantriId = _activeSantri?.id;
        if (currentActiveSantriId != null) {
          _activeSantri = _santriList.firstWhere(
            (s) => s.id == currentActiveSantriId,
            orElse: () => _santriList.first,
          );
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
