import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/wali_model.dart';
import '../utils/storage_helper.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  WaliModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  WaliModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  // Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      
      if (response.statusCode == 200) {
        final data = response.data;
        
        // Save token
        await StorageHelper.saveToken(data['token']);
        
        // Save user
        await StorageHelper.saveUser(data['user']);
        
        // Set current user
        _currentUser = WaliModel.fromJson(data['user']);
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
      
      _errorMessage = 'Login gagal';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    await StorageHelper.clearAll();
    _currentUser = null;
    notifyListeners();
  }

  // Check if already logged in
  Future<void> checkLoginStatus() async {
    final isLoggedIn = await StorageHelper.isLoggedIn();
    if (isLoggedIn) {
      final userData = await StorageHelper.getUser();
      if (userData != null) {
        _currentUser = WaliModel.fromJson(userData);
        notifyListeners();
      }
    }
  }
}
