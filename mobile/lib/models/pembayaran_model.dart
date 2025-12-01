class PembayaranModel {
  final int id;
  final String tanggal;
  final String keterangan;
  final double jumlah;
  final String? metodePembayaran;
  final String status;

  PembayaranModel({
    required this.id,
    required this.tanggal,
    required this.keterangan,
    required this.jumlah,
    this.metodePembayaran,
    required this.status,
  });

  factory PembayaranModel.fromJson(Map<String, dynamic> json) {
    return PembayaranModel(
      id: json['id'] ?? 0,
      tanggal: json['tanggal'] ?? '',
      keterangan: json['keterangan'] ?? '',
      jumlah: json['jumlah'] != null
          ? double.parse(json['jumlah'].toString())
          : 0.0,
      metodePembayaran: json['metode_pembayaran'],
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tanggal': tanggal,
      'keterangan': keterangan,
      'jumlah': jumlah,
      'metode_pembayaran': metodePembayaran,
      'status': status,
    };
  }
}
