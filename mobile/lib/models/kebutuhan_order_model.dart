class KebutuhanOrderModel {
  final int id;
  final String eposOrderId;
  final String santriId;
  final String santriName;
  final List<KebutuhanOrderItem> items;
  final double totalAmount;
  final String status;
  final String? confirmedBy;
  final DateTime? confirmedAt;
  final DateTime expiredAt;
  final String? rejectionReason;
  final DateTime createdAt;

  KebutuhanOrderModel({
    required this.id,
    required this.eposOrderId,
    required this.santriId,
    required this.santriName,
    required this.items,
    required this.totalAmount,
    required this.status,
    this.confirmedBy,
    this.confirmedAt,
    required this.expiredAt,
    this.rejectionReason,
    required this.createdAt,
  });

  factory KebutuhanOrderModel.fromJson(Map<String, dynamic> json) {
    return KebutuhanOrderModel(
      id: json['id'] as int,
      eposOrderId: json['epos_order_id'] ?? '',
      santriId: json['santri_id'].toString(),
      santriName: json['santri_name'] ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => KebutuhanOrderItem.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0,
      status: json['status'] ?? 'pending',
      confirmedBy: json['confirmed_by'],
      confirmedAt: json['confirmed_at'] != null
          ? DateTime.tryParse(json['confirmed_at'])
          : null,
      expiredAt: DateTime.parse(json['expired_at']),
      rejectionReason: json['rejection_reason'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isRejected => status == 'rejected';
  bool get isExpired => status == 'expired';
  bool get isCompleted => status == 'completed';
}

class KebutuhanOrderItem {
  final String name;
  final int qty;
  final double price;
  final double subtotal;
  final String? unit;

  KebutuhanOrderItem({
    required this.name,
    required this.qty,
    required this.price,
    required this.subtotal,
    this.unit,
  });

  factory KebutuhanOrderItem.fromJson(Map<String, dynamic> json) {
    final qty = (json['qty'] as num?)?.toInt() ?? 0;
    final price = (json['price'] as num?)?.toDouble() ?? 0;
    return KebutuhanOrderItem(
      name: json['name'] ?? 'Unknown Item',
      qty: qty,
      price: price,
      subtotal: qty * price,  // Calculate from qty * price
    );
  }
}
