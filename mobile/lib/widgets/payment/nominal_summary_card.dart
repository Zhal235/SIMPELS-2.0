import 'package:flutter/material.dart';

class NominalSummaryCard extends StatelessWidget {
  final double paymentAmount;
  final double topupAmount;
  final double tabunganAmount;
  final String Function(double) formatCurrency;

  const NominalSummaryCard({
    super.key,
    required this.paymentAmount,
    required this.topupAmount,
    required this.tabunganAmount,
    required this.formatCurrency,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nominal Pembayaran',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Colors.blue.shade900,
              ),
            ),
            const SizedBox(height: 16),
            if (paymentAmount > 0) ...[
              _buildInfoRow('Pembayaran Tagihan', 'Rp ${formatCurrency(paymentAmount)}'),
              const SizedBox(height: 8),
            ],
            if (topupAmount > 0) ...[
              _buildInfoRow('Top-up Dompet', 'Rp ${formatCurrency(topupAmount)}'),
              const SizedBox(height: 8),
            ],
            if (tabunganAmount > 0) ...[
              _buildInfoRow('Setor Tabungan', 'Rp ${formatCurrency(tabunganAmount)}'),
              const SizedBox(height: 8),
            ],
            const Divider(),
            const SizedBox(height: 8),
            _buildInfoRow(
              'TOTAL TRANSFER',
              'Rp ${formatCurrency(paymentAmount + topupAmount + tabunganAmount)}',
              isBold: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? Colors.black : Colors.grey,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.w600),
        ),
      ],
    );
  }
}
