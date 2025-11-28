import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/upload_bukti_screen.dart';
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
              return MaterialPageRoute(
                builder: (context) => UploadBuktiScreen(
                  selectedTagihan: args['selectedTagihan'] as List<dynamic>,
                  totalNominal: args['totalNominal'] as double,
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
