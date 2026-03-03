import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/bukti_transfer.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/widgets/bukti/bukti_image_viewer.dart';

void showBuktiDetailDialog(BuildContext context, BuktiTransfer bukti) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: _getStatusColor(bukti.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getStatusColor(bukti.status),
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_getStatusIcon(bukti.status),
                              color: _getStatusColor(bukti.status), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            bukti.statusLabel,
                            style: TextStyle(
                              color: _getStatusColor(bukti.status),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildInfoCard(
                      icon: Icons.payment,
                      title: 'Jenis Transaksi',
                      value: bukti.jenisTransaksiLabel,
                      color: Colors.blue),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                      icon: Icons.attach_money,
                      title: 'Total Nominal',
                      value: _formatCurrency(bukti.totalNominal),
                      color: Colors.green),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                      icon: Icons.upload,
                      title: 'Tanggal Upload',
                      value: _formatDate(bukti.uploadedAt),
                      color: Colors.purple),
                  const SizedBox(height: 12),
                  if (bukti.processedAt != null) ...[
                    _buildInfoCard(
                        icon: Icons.verified,
                        title: 'Tanggal Diproses',
                        value: _formatDate(bukti.processedAt!),
                        color: Colors.teal),
                    const SizedBox(height: 12),
                  ],
                  if (bukti.processedBy != null) ...[
                    _buildInfoCard(
                        icon: Icons.person,
                        title: 'Diproses Oleh',
                        value: bukti.processedBy!,
                        color: Colors.indigo),
                    const SizedBox(height: 12),
                  ],
                  if (bukti.catatanWali != null &&
                      bukti.catatanWali!.isNotEmpty) ...[
                    _buildNoteCard(
                        title: 'Catatan Anda',
                        content: bukti.catatanWali!,
                        icon: Icons.note,
                        color: Colors.blue),
                    const SizedBox(height: 12),
                  ],
                  if (bukti.catatanAdmin != null &&
                      bukti.catatanAdmin!.isNotEmpty) ...[
                    _buildNoteCard(
                        title: bukti.status == 'rejected'
                            ? 'Alasan Penolakan'
                            : 'Catatan Admin',
                        content: bukti.catatanAdmin!,
                        icon: bukti.status == 'rejected'
                            ? Icons.warning
                            : Icons.admin_panel_settings,
                        color: bukti.status == 'rejected'
                            ? Colors.red
                            : Colors.orange),
                    const SizedBox(height: 12),
                  ],
                  if (bukti.tagihan != null && bukti.tagihan!.isNotEmpty)
                    BuktiTagihanSection(
                        tagihan: bukti.tagihan!,
                        formatCurrency: _formatCurrency),
                  if (bukti.nominalTopup > 0) ...[
                    const SizedBox(height: 8),
                    _buildBreakdownRow(
                        icon: Icons.account_balance_wallet,
                        label: 'Top-up Dompet',
                        value: _formatCurrency(bukti.nominalTopup),
                        color: Colors.blue),
                  ],
                  if (bukti.nominalTabungan > 0) ...[
                    const SizedBox(height: 8),
                    _buildBreakdownRow(
                        icon: Icons.savings,
                        label: 'Setor Tabungan',
                        value: _formatCurrency(bukti.nominalTabungan),
                        color: Colors.teal),
                  ],
                  const SizedBox(height: 20),
                  BuktiImageViewer(
                      imageUrl: ApiService.getFullImageUrl(bukti.buktiUrl)),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

Widget _buildInfoCard({
  required IconData icon,
  required String title,
  required String value,
  required Color color,
}) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: color.withOpacity(0.05),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withOpacity(0.2)),
    ),
    child: Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              const SizedBox(height: 4),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget _buildNoteCard({
  required String title,
  required String content,
  required IconData icon,
  required Color color,
}) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: color.withOpacity(0.05),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(title,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: color)),
          ],
        ),
        const SizedBox(height: 8),
        Text(content, style: const TextStyle(fontSize: 13)),
      ],
    ),
  );
}

Widget _buildBreakdownRow({
  required IconData icon,
  required String label,
  required String value,
  required MaterialColor color,
}) {
  return Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color.shade50,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.shade200),
    ),
    child: Row(
      children: [
        Icon(icon, color: color.shade600, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: color.shade700)),
        ),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: color.shade700)),
      ],
    ),
  );
}

Color _getStatusColor(String status) {
  switch (status) {
    case 'pending':
      return Colors.orange;
    case 'approved':
      return Colors.green;
    case 'rejected':
      return Colors.red;
    default:
      return Colors.grey;
  }
}

IconData _getStatusIcon(String status) {
  switch (status) {
    case 'pending':
      return Icons.schedule;
    case 'approved':
      return Icons.check_circle;
    case 'rejected':
      return Icons.cancel;
    default:
      return Icons.info;
  }
}

String _formatCurrency(double amount) {
  final value = amount.toStringAsFixed(0);
  return 'Rp ${value.replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (Match m) => '${m[1]}.',
  )}';
}

String _formatDate(DateTime date) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}
