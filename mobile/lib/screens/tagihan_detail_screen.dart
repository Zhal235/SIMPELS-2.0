import 'package:flutter/material.dart';
import 'payment_info_screen.dart';

/// Wrapper untuk backward compatibility
/// Redirect ke PaymentInfoScreen untuk menampilkan info rekening bank dulu
class TagihanDetailScreen extends StatelessWidget {
  final Map<String, dynamic> tagihan;

  const TagihanDetailScreen({
    super.key,
    required this.tagihan,
  });

  @override
  Widget build(BuildContext context) {
    return PaymentInfoScreen(
      tagihan: tagihan,
      isTopupOnly: false,
    );
  }
}
