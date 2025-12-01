import 'package:flutter/foundation.dart';

/// Safe logging utility that only prints in debug mode
class AppLogger {
  /// Log info messages (only in debug mode)
  static void info(String message) {
    if (kDebugMode) {
      debugPrint('[INFO] $message');
    }
  }

  /// Log error messages (only in debug mode)
  static void error(String message, [Object? error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      debugPrint('[ERROR] $message');
      if (error != null) debugPrint('Error: $error');
      if (stackTrace != null) debugPrint('Stack: $stackTrace');
    }
  }

  /// Log warning messages (only in debug mode)
  static void warning(String message) {
    if (kDebugMode) {
      debugPrint('[WARNING] $message');
    }
  }

  /// Log debug messages (only in debug mode)
  static void debug(String message) {
    if (kDebugMode) {
      debugPrint('[DEBUG] $message');
    }
  }
}
