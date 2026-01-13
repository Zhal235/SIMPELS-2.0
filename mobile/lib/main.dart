import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/payment_info_screen.dart';
import 'screens/wallet_full_history_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/multiple_payment_info_screen.dart';
import 'screens/unified_payment_screen.dart';
import 'providers/auth_provider.dart';
import 'config/app_theme.dart';

void main() {
  runApp(const SimpleMobileApp());
}

class SimpleMobileApp extends StatelessWidget {
  const SimpleMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'SIMPELS Mobile',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const SplashScreen(),
        onGenerateRoute: (settings) {
          if (settings.name == '/upload-bukti') {
            final args = settings.arguments as Map<String, dynamic>?;
            if (args != null) {
              final selectedTagihan = args['selectedTagihan'] as List<dynamic>?;
              final nominalTopup = args['nominalTopup'] as double?;

              // If only topup, use PaymentInfoScreen in topup mode
              if (selectedTagihan == null || selectedTagihan.isEmpty) {
                return MaterialPageRoute(
                  builder: (context) => PaymentInfoScreen(
                    isTopupOnly: true,
                    topupNominal: nominalTopup ?? 0,
                  ),
                );
              }

              // If single tagihan, use PaymentInfoScreen to show bank info first
              if (selectedTagihan.length == 1) {
                return MaterialPageRoute(
                  builder: (context) => PaymentInfoScreen(
                    tagihan: selectedTagihan[0] as Map<String, dynamic>,
                    isTopupOnly: false,
                  ),
                );
              }

              // Multiple tagihan: use MultiplePaymentInfoScreen
              return MaterialPageRoute(
                builder: (context) => MultiplePaymentInfoScreen(
                  selectedTagihan: selectedTagihan
                      .map((e) => Map<String, dynamic>.from(e as Map))
                      .toList(),
                ),
              );
            }
          }
          if (settings.name == '/wallet-full-history') {
            final args = settings.arguments as Map<String, dynamic>?;
            if (args != null) {
              return MaterialPageRoute(
                builder: (context) => WalletFullHistoryScreen(
                  santriId: args['santriId'] as String,
                  santriName: args['santriName'] as String,
                ),
              );
            }
          }
          if (settings.name == '/change-password') {
            return MaterialPageRoute(
              builder: (context) => const ChangePasswordScreen(),
            );
          }
          if (settings.name == '/unified-payment') {
            final args = settings.arguments as Map<String, dynamic>?;
            if (args != null) {
              final isMultiple = args['isMultiplePayment'] as bool? ?? false;
              
              if (isMultiple) {
                // Multiple payment - handle as batch
                return MaterialPageRoute(
                  builder: (context) => UnifiedPaymentScreen(
                    isMultiplePayment: true,
                    multipleTagihan: args['selectedTagihan'] as List<dynamic>?,
                    selectedBankId: args['selectedBankId'] as int?,
                    shouldIncludeTopup: args['includeTopup'] as bool? ?? false,
                    topupNominal: args['topupNominal'] as double?,
                    fromDraft: args['fromDraft'] as bool? ?? false,
                  ),
                );
              }
            }
          }
          return null;
        },
      ),
    );
  }
}
