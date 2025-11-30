import 'package:flutter/material.dart';
import 'unified_payment_screen.dart';

/// Wrapper untuk backward compatibility
/// Redirect ke UnifiedPaymentScreen
class TagihanDetailScreen extends StatelessWidget {
  final Map<String, dynamic> tagihan;

  const TagihanDetailScreen({
    super.key,
    required this.tagihan,
  });

  @override
  Widget build(BuildContext context) {
    return UnifiedPaymentScreen(
      tagihan: tagihan,
      isTopupOnly: false,
    );
  }
}
