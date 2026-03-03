import 'package:flutter/material.dart';

class WalletTransactionCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final String Function(dynamic) formatNumber;
  final String Function(String) formatDate;

  const WalletTransactionCard({
    super.key,
    required this.item,
    required this.formatNumber,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    final isCredit = item['transaction_type'] == 'credit';
    final amount = (item['amount'] as num).toDouble();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isCredit ? Colors.green.shade100 : Colors.red.shade100,
          child: Icon(isCredit ? Icons.add : Icons.remove, color: isCredit ? Colors.green : Colors.red),
        ),
        title: Text(item['description'] ?? 'Transaksi Dompet'),
        subtitle: Text(formatDate(item['date'] ?? ''), style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isCredit ? '+' : '-'}Rp ${formatNumber(amount)}',
              style: TextStyle(fontWeight: FontWeight.bold, color: isCredit ? Colors.green : Colors.red),
            ),
            Text('Saldo: Rp ${formatNumber(item['balance_after'] ?? 0)}', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }
}

class BuktiTransferCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final String Function(dynamic) formatNumber;
  final String Function(String) formatDate;

  const BuktiTransferCard({
    super.key,
    required this.item,
    required this.formatNumber,
    required this.formatDate,
  });

  static String getJenisLabel(String jenis) {
    switch (jenis) {
      case 'topup': return 'Top-up Dompet';
      case 'pembayaran': return 'Pembayaran Tagihan';
      case 'pembayaran_topup': return 'Pembayaran + Top-up';
      default: return 'Transaksi';
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = item['status'] ?? 'pending';
    final jenisTransaksi = item['jenis_transaksi'] ?? 'pembayaran';

    final (statusColor, statusIcon, statusText) = switch (status) {
      'approved' => (Colors.green, Icons.check_circle, 'Disetujui'),
      'rejected' => (Colors.red, Icons.cancel, 'Ditolak'),
      _ => (Colors.orange, Icons.pending, 'Menunggu'),
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.2),
          child: Icon(statusIcon, color: statusColor),
        ),
        title: Text(getJenisLabel(jenisTransaksi)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(formatDate(item['date'] ?? ''), style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
              child: Text(statusText, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        trailing: Text('Rp ${formatNumber(item['amount'] ?? 0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item['catatan_wali'] != null && item['catatan_wali'].toString().isNotEmpty) ...[
                  const Text('Catatan Wali:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(item['catatan_wali']),
                  const SizedBox(height: 12),
                ],
                if (status == 'rejected' && item['catatan_admin'] != null) ...[
                  const Text('Alasan Ditolak:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  const SizedBox(height: 4),
                  Text(item['catatan_admin'], style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 12),
                ],
                if (status == 'approved' && item['processed_at'] != null) ...[
                  Text('Disetujui pada: ${formatDate(item['processed_at'])}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                  const SizedBox(height: 12),
                ],
                if ((item['tagihan'] as List).isNotEmpty) ...[
                  const Text('Tagihan yang dibayar:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...(item['tagihan'] as List).map((t) => Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 4),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, size: 16, color: Colors.green),
                        const SizedBox(width: 8),
                        Expanded(child: Text('${t['jenis']} - ${t['bulan']} ${t['tahun']}', style: const TextStyle(fontSize: 13))),
                        Text('Rp ${formatNumber(t['nominal'])}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
