class TunggakanModel {
  final int id;
  final String jenisTagihan;
  final String bulan;
  final int tahun;
  final double jumlah;
  final double? sudahDibayar;
  final double sisa;
  final String status;
  final String? jatuhTempo;

  TunggakanModel({
    required this.id,
    required this.jenisTagihan,
    required this.bulan,
    required this.tahun,
    required this.jumlah,
    this.sudahDibayar,
    required this.sisa,
    required this.status,
    this.jatuhTempo,
  });

  factory TunggakanModel.fromJson(Map<String, dynamic> json) {
    return TunggakanModel(
      id: json['id'] ?? 0,
      jenisTagihan: json['jenis_tagihan'] ?? '',
      bulan: json['bulan'] ?? '',
      tahun: json['tahun'] ?? DateTime.now().year,
      jumlah: json['jumlah'] != null
          ? double.parse(json['jumlah'].toString())
          : 0.0,
      sudahDibayar: json['sudah_dibayar'] != null
          ? double.parse(json['sudah_dibayar'].toString())
          : null,
      sisa: json['sisa'] != null ? double.parse(json['sisa'].toString()) : 0.0,
      status: json['status'] ?? 'belum_lunas',
      jatuhTempo: json['jatuh_tempo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jenis_tagihan': jenisTagihan,
      'bulan': bulan,
      'tahun': tahun,
      'jumlah': jumlah,
      'sudah_dibayar': sudahDibayar,
      'sisa': sisa,
      'status': status,
      'jatuh_tempo': jatuhTempo,
    };
  }
}
