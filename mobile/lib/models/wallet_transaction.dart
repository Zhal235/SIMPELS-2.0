class WalletTransaction {
  final String id;
  final DateTime tanggal;
  final String keterangan;
  final double jumlah;
  final String tipe; // 'credit' or 'debit'
  final double saldoAkhir;

  WalletTransaction({
    required this.id,
    required this.tanggal,
    required this.keterangan,
    required this.jumlah,
    required this.tipe,
    required this.saldoAkhir,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    // Parse tanggal - handle various formats
    DateTime parsedDate;
    final tanggalRaw = json['tanggal'] ?? json['created_at'];

    if (tanggalRaw != null) {
      // Try parsing as ISO8601 or various common formats
      parsedDate = DateTime.tryParse(tanggalRaw.toString()) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    // Safe parsing for numeric values
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        return parsed ?? 0.0;
      }
      return 0.0;
    }

    return WalletTransaction(
      id: json['id']?.toString() ?? '',
      tanggal: parsedDate,
      keterangan: json['keterangan']?.toString() ??
          json['description']?.toString() ??
          '',
      jumlah: parseDouble(json['jumlah'] ?? json['amount']),
      tipe: json['tipe']?.toString() ?? json['type']?.toString() ?? 'credit',
      saldoAkhir: parseDouble(json['saldo_akhir'] ?? json['balance_after']),
    );
  }
}
