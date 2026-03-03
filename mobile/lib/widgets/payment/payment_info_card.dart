import 'package:flutter/material.dart';

class PaymentInfoCard extends StatelessWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final bool isMultiplePayment;
  final List<dynamic>? multipleTagihan;
  final String? santriName;
  final String Function(double) formatCurrency;

  const PaymentInfoCard({
    super.key,
    required this.tagihan,
    required this.isTopupOnly,
    required this.isMultiplePayment,
    required this.multipleTagihan,
    required this.santriName,
    required this.formatCurrency,
  });

  @override
  Widget build(BuildContext context) {
    if (isMultiplePayment && multipleTagihan != null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${multipleTagihan!.length} Tagihan Dipilih',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ...multipleTagihan!.map((t) {
                if (t is! Map) return const SizedBox.shrink();
                final sisa = double.tryParse(t['sisa']?.toString() ?? '0') ?? 0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, size: 18, color: Colors.green.shade600),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t['jenis_tagihan'] ?? 'Tagihan',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                            if (t['bulan'] != null)
                              Text(
                                '${t['bulan']} ${t['tahun']}',
                                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                              ),
                          ],
                        ),
                      ),
                      Text(
                        'Rp ${formatCurrency(sisa)}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      );
    }

    if (isTopupOnly) {
      return Card(
        color: Colors.blue.shade50,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.account_balance_wallet, color: Colors.blue.shade700),
                  const SizedBox(width: 8),
                  Text(
                    'Informasi Top-up',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ],
              ),
              if (santriName != null) ...[
                const SizedBox(height: 12),
                _buildInfoRow('Santri', santriName!),
              ],
            ],
          ),
        ),
      );
    }

    final jumlah = tagihan != null
        ? (double.tryParse(tagihan!['nominal']?.toString() ?? tagihan!['jumlah']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sudahDibayar = tagihan != null
        ? (double.tryParse(tagihan!['dibayar']?.toString() ?? tagihan!['sudah_dibayar']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sisa = tagihan != null
        ? (double.tryParse(tagihan!['sisa']?.toString() ?? '0') ?? 0.0)
        : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tagihan?['jenis_tagihan'] ?? 'Tagihan',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            if (tagihan?['bulan'] != null) ...[
              const SizedBox(height: 8),
              Text(
                '${tagihan!['bulan']} ${tagihan!['tahun']}',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
            const Divider(height: 24),
            _buildInfoRow('Total Tagihan', 'Rp ${formatCurrency(jumlah)}'),
            const SizedBox(height: 8),
            _buildInfoRow('Sudah Dibayar', 'Rp ${formatCurrency(sudahDibayar)}'),
            const Divider(height: 24),
            _buildInfoRow('Sisa Tagihan', 'Rp ${formatCurrency(sisa)}', isBold: true),
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
