import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:simpels_mobile/models/kebutuhan_order_model.dart';
import 'package:simpels_mobile/services/api_service.dart';

class KebutuhanDetailScreen extends StatefulWidget {
  final KebutuhanOrderModel order;

  const KebutuhanDetailScreen({super.key, required this.order});

  @override
  State<KebutuhanDetailScreen> createState() => _KebutuhanDetailScreenState();
}

class _KebutuhanDetailScreenState extends State<KebutuhanDetailScreen> {
  final ApiService _api = ApiService();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    // Initialize date formatting for Indonesian locale
    initializeDateFormatting('id', null);
  }

  Future<void> _confirm() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi Pesanan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Dengan konfirmasi ini:'),
            const SizedBox(height: 8),
            const Text('• Saldo dompet santri akan dipotong'),
            const Text('• Petugas toko akan menyerahkan barang'),
            const SizedBox(height: 12),
            Text(
              'Total: ${NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(widget.order.totalAmount)}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0D9488)),
            child: const Text('Ya, Konfirmasi',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _submitting = true);
    try {
      final res = await _api.respondKebutuhanOrder(widget.order.id, action: 'confirm');
      if (res.statusCode == 200 && res.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Pesanan dikonfirmasi! Saldo santri berhasil dipotong.'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        _showError(res.data['message'] ?? 'Gagal konfirmasi');
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Gagal: $msg'), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency =
        NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    final df = DateFormat('EEEE, dd MMMM yyyy  HH:mm', 'id');
    final order = widget.order;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Detail Pesanan Kebutuhan'),
        backgroundColor: const Color(0xFF0D9488),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(order),
            const SizedBox(height: 16),
            _buildInfoCard(order, df),
            const SizedBox(height: 16),
            _buildItemsCard(order, currency),
            const SizedBox(height: 16),
            _buildTotalCard(order, currency),
            if (order.isRejected && order.rejectionReason != null) ...[
              const SizedBox(height: 16),
              _buildRejectionCard(order),
            ],
            if (order.isPending) ...[
              const SizedBox(height: 24),
              _buildActionButtons(),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(KebutuhanOrderModel order) {
    Color bg;
    Color fg;
    IconData icon;
    String label;

    switch (order.status) {
      case 'pending':
        bg = const Color(0xFFFFF3CD);
        fg = const Color(0xFF856404);
        icon = Icons.hourglass_top_rounded;
        label = 'Menunggu Konfirmasi Anda';
        break;
      case 'confirmed':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        icon = Icons.check_circle_rounded;
        label = 'Sudah Dikonfirmasi';
        break;
      case 'rejected':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        icon = Icons.cancel_rounded;
        label = 'Ditolak';
        break;
      case 'expired':
        bg = Colors.grey[100]!;
        fg = Colors.grey[700]!;
        icon = Icons.timer_off_rounded;
        label = 'Kedaluwarsa';
        break;
      default:
        bg = const Color(0xFFCCFBF1);
        fg = const Color(0xFF0F766E);
        icon = Icons.done_all_rounded;
        label = 'Selesai';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Icon(icon, color: fg, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style:
                    TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(KebutuhanOrderModel order, DateFormat df) {
    return _card(
      title: 'Informasi Pesanan',
      child: Column(
        children: [
          _infoRow('No. Pesanan', order.eposOrderId, mono: true),
          _infoRow('Santri', order.santriName),
          _infoRow('Dibuat', df.format(order.createdAt.toLocal())),
          _infoRow('Berlaku sampai', df.format(order.expiredAt.toLocal()),
              highlight: order.isPending),
          if (order.confirmedAt != null)
            _infoRow('Dikonfirmasi pada', df.format(order.confirmedAt!.toLocal())),
          if (order.confirmedBy != null)
            _infoRow('Dikonfirmasi oleh',
                order.confirmedBy == 'admin' ? 'Admin Pesantren' : 'Orang Tua'),
        ],
      ),
    );
  }

  Widget _buildItemsCard(KebutuhanOrderModel order, NumberFormat currency) {
    return _card(
      title: 'Item yang Dipesan',
      child: Column(
        children: order.items
            .map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.name,
                                style: const TextStyle(fontWeight: FontWeight.w500)),
                            Text('${item.qty}× ${currency.format(item.price)}',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600])),
                          ],
                        ),
                      ),
                      Text(currency.format(item.subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildTotalCard(KebutuhanOrderModel order, NumberFormat currency) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0D9488),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Total',
              style: TextStyle(
                  color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          Text(currency.format(order.totalAmount),
              style: const TextStyle(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildRejectionCard(KebutuhanOrderModel order) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.red[400]),
          const SizedBox(width: 8),
          Expanded(
            child: Text(order.rejectionReason!,
                style: TextStyle(color: Colors.red[700])),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _submitting ? null : _confirm,
            icon: _submitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check_circle_outline, size: 22),
            label: Text(
              _submitting ? 'Memproses...' : 'Konfirmasi & Potong Saldo',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0D9488),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: _submitting ? null : () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, size: 20),
            label: const Text('Kembali'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.grey[700],
              side: BorderSide(color: Colors.grey[400]!),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _card({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600])),
          const Divider(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value,
      {bool mono = false, bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label,
                style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontFamily: mono ? 'monospace' : null,
                color: highlight ? Colors.orange[700] : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
