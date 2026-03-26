import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:simpels_mobile/models/kebutuhan_order_model.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'kebutuhan_detail_screen.dart';

class KebutuhanScreen extends StatefulWidget {
  final String santriId;
  final String santriName;

  const KebutuhanScreen({
    super.key,
    required this.santriId,
    required this.santriName,
  });

  @override
  State<KebutuhanScreen> createState() => _KebutuhanScreenState();
}

class _KebutuhanScreenState extends State<KebutuhanScreen> {
  final ApiService _api = ApiService();
  List<KebutuhanOrderModel> _orders = [];
  bool _loading = true;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getKebutuhanOrders(widget.santriId);
      if (res.statusCode == 200 && res.data['success'] == true) {
        final List<dynamic> data = res.data['data'] ?? [];
        setState(() {
          _orders = data
              .map((j) => KebutuhanOrderModel.fromJson(j as Map<String, dynamic>))
              .toList();
          _pendingCount = res.data['pending_count'] as int? ?? 0;
        });
      }
    } catch (e) {
      debugPrint('KebutuhanScreen load error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memuat pesanan. Silakan coba lagi.'),
            backgroundColor: Colors.red[600],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'expired':
        return Colors.grey;
      case 'completed':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'rejected':
        return 'Ditolak';
      case 'expired':
        return 'Kedaluwarsa';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_top_rounded;
      case 'confirmed':
        return Icons.check_circle_rounded;
      case 'rejected':
        return Icons.cancel_rounded;
      case 'expired':
        return Icons.timer_off_rounded;
      case 'completed':
        return Icons.done_all_rounded;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Pesanan Kebutuhan'),
            Text(widget.santriName,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: const Color(0xFF0D9488),
        foregroundColor: Colors.white,
        actions: [
          if (_pendingCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Badge(
                backgroundColor: Colors.red,
                label: Text('$_pendingCount'),
                child: const Icon(Icons.notifications_active),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0D9488)))
          : _orders.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  color: const Color(0xFF0D9488),
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, i) => _buildOrderCard(_orders[i], currency),
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 72, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text('Belum ada pesanan kebutuhan',
              style: TextStyle(fontSize: 16, color: Colors.grey[600])),
          const SizedBox(height: 8),
          Text('Pesanan akan muncul di sini ketika\npetuga toko membuat pesanan untuk santri',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[500])),
        ],
      ),
    );
  }

  Widget _buildOrderCard(KebutuhanOrderModel order, NumberFormat currency) {
    final color = _statusColor(order.status);
    final canRespond = order.isPending;
    final df = DateFormat('dd MMM yyyy, HH:mm');

    return GestureDetector(
      onTap: canRespond
          ? () => _openDetail(order)
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: canRespond ? const Color(0xFF0D9488) : Colors.grey[200]!,
            width: canRespond ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(order.eposOrderId,
                        style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 13)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_statusIcon(order.status), size: 14, color: color),
                        const SizedBox(width: 4),
                        Text(_statusLabel(order.status),
                            style: TextStyle(
                                color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('${order.items.length} item  •  ${currency.format(order.totalAmount)}',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(
                order.items.map((i) => i.name).take(3).join(', ') +
                    (order.items.length > 3 ? ' +${order.items.length - 3} lainnya' : ''),
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.access_time, size: 12, color: Colors.grey[400]),
                  const SizedBox(width: 4),
                  Text(df.format(order.createdAt.toLocal()),
                      style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                  if (order.isPending) ...[
                    const Spacer(),
                    Icon(Icons.timer_outlined, size: 12, color: Colors.orange[400]),
                    const SizedBox(width: 4),
                    Text('Sampai ${df.format(order.expiredAt.toLocal())}',
                        style: TextStyle(fontSize: 11, color: Colors.orange[600])),
                  ],
                ],
              ),
              if (order.isRejected && order.rejectionReason != null) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, size: 14, color: Colors.red[400]),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(order.rejectionReason!,
                            style: TextStyle(fontSize: 12, color: Colors.red[700])),
                      ),
                    ],
                  ),
                ),
              ],
              if (canRespond) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showRejectDialog(order),
                        icon: const Icon(Icons.close, size: 18),
                        label: const Text('Tolak'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _openDetail(order),
                        icon: const Icon(Icons.check, size: 18),
                        label: const Text('Konfirmasi'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0D9488),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _openDetail(KebutuhanOrderModel order) async {
    final refreshed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => KebutuhanDetailScreen(order: order),
      ),
    );
    if (refreshed == true) _loadOrders();
  }

  void _showRejectDialog(KebutuhanOrderModel order) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tolak Pesanan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tolak pesanan ${order.eposOrderId}?',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Alasan penolakan (opsional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _respond(order, 'reject', reason: controller.text);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Tolak', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _respond(KebutuhanOrderModel order, String action,
      {String? reason}) async {
    try {
      final res = await _api.respondKebutuhanOrder(
        order.id,
        action: action,
        rejectionReason: reason,
      );
      if (res.statusCode == 200 && res.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(action == 'confirm'
                  ? '✅ Pesanan dikonfirmasi, saldo santri dipotong'
                  : 'Pesanan ditolak'),
              backgroundColor: action == 'confirm' ? Colors.green : Colors.red,
            ),
          );
        }
        _loadOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
