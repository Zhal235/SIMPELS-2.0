import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../config/app_config.dart';

class StorageHelper {
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.tokenKey);
  }

  static Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.userKey, jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(AppConfig.userKey);
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> saveSantriList(
      List<Map<String, dynamic>> santriList) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('santri_list', jsonEncode(santriList));
  }

  static Future<List<Map<String, dynamic>>?> getSantriList() async {
    final prefs = await SharedPreferences.getInstance();
    final santriStr = prefs.getString('santri_list');
    if (santriStr != null) {
      return List<Map<String, dynamic>>.from(jsonDecode(santriStr));
    }
    return null;
  }

  static Future<void> saveActiveSantriId(String santriId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('active_santri_id', santriId);
  }

  static Future<String?> getActiveSantriId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('active_santri_id');
  }
}
