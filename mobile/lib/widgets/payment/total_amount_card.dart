import 'package:flutter/material.dart';

class TotalAmountCard extends StatelessWidget {
  final double total;
  final String Function(double) formatCurrency;

  const TotalAmountCard({super.key, required this.total, required this.formatCurrency});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.blue.shade700, Colors.blue.shade900]),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Text('Total yang Harus Ditransfer', style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 8),
          Text('Rp ${formatCurrency(total)}', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
