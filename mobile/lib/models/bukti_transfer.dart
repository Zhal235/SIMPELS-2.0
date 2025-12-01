class BuktiTransfer {
  final int id;
  final String jenisTransaksi; // 'pembayaran', 'topup', 'pembayaran_topup'
  final double totalNominal;
  final String status; // 'pending', 'approved', 'rejected'
  final String? catatanWali;
  final String? catatanAdmin;
  final String buktiUrl;
  final DateTime uploadedAt;
  final DateTime? processedAt;
  final String? processedBy;
  final List<TagihanItem>? tagihan;

  BuktiTransfer({
    required this.id,
    required this.jenisTransaksi,
    required this.totalNominal,
    required this.status,
    this.catatanWali,
    this.catatanAdmin,
    required this.buktiUrl,
    required this.uploadedAt,
    this.processedAt,
    this.processedBy,
    this.tagihan,
  });

  factory BuktiTransfer.fromJson(Map<String, dynamic> json) {
    try {
      return BuktiTransfer(
        id: _parseInt(json['id']),
        jenisTransaksi: json['jenis_transaksi'] as String? ?? 'pembayaran',
        totalNominal: _parseDouble(json['total_nominal']),
        status: json['status'] as String? ?? 'pending',
        catatanWali: json['catatan_wali'] as String?,
        catatanAdmin: json['catatan_admin'] as String?,
        buktiUrl: json['bukti_url'] as String? ?? '',
        uploadedAt: _parseDateTime(json['uploaded_at']),
        processedAt: _parseDateTime(json['processed_at']),
        processedBy: json['processed_by'] as String?,
        tagihan: json['tagihan'] != null && json['tagihan'] is List
            ? (json['tagihan'] as List).map((t) => TagihanItem.fromJson(t as Map<String, dynamic>)).toList()
            : null,
      );
    } catch (e) {
      throw FormatException('Error parsing BuktiTransfer: $e, JSON: $json');
    }
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  String get jenisTransaksiLabel {
    switch (jenisTransaksi) {
      case 'pembayaran':
        return 'Pembayaran Tagihan';
      case 'topup':
        return 'Top-up Dompet';
      case 'pembayaran_topup':
        return 'Pembayaran + Top-up';
      default:
        return jenisTransaksi;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Menunggu Verifikasi';
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  }
}

class TagihanItem {
  final int id;
  final String jenis;
  final String? bulan;
  final int tahun;
  final double nominal;
  final double dibayar;
  final double sisa;

  TagihanItem({
    required this.id,
    required this.jenis,
    this.bulan,
    required this.tahun,
    required this.nominal,
    required this.dibayar,
    required this.sisa,
  });

  factory TagihanItem.fromJson(Map<String, dynamic> json) {
    return TagihanItem(
      id: _parseInt(json['id']),
      jenis: json['jenis'] as String? ?? '',
      bulan: json['bulan'] as String?,
      tahun: _parseInt(json['tahun']),
      nominal: _parseDouble(json['nominal']),
      dibayar: _parseDouble(json['dibayar']),
      sisa: _parseDouble(json['sisa']),
    );
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}
