import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/unified_payment_screen.dart';
import 'screens/wallet_full_history_screen.dart';
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
              
              // If only topup, use topup mode
              if (selectedTagihan == null || selectedTagihan.isEmpty) {
                return MaterialPageRoute(
                  builder: (context) => UnifiedPaymentScreen(
                    isTopupOnly: true,
                    topupNominal: nominalTopup ?? 0,
                  ),
                );
              }
              
              // If single tagihan, pass tagihan object
              if (selectedTagihan.length == 1) {
                return MaterialPageRoute(
                  builder: (context) => UnifiedPaymentScreen(
                    tagihan: selectedTagihan[0] as Map<String, dynamic>,
                    isTopupOnly: false,
                  ),
                );
              }
              
              // Multiple tagihan: use first one for now
              // TODO: Handle multiple tagihan properly
              return MaterialPageRoute(
                builder: (context) => UnifiedPaymentScreen(
                  tagihan: selectedTagihan[0] as Map<String, dynamic>,
                  isTopupOnly: false,
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
          return null;
        },
      ),
    );
  }
}
