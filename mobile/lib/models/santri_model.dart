class SantriModel {
  final String id; // UUID
  final String nis;
  final String nama;
  final String jenisKelamin;
  final String? kelas;
  final String? asrama;
  final String? fotoUrl;
  final double saldoDompet;
  final double? limitHarian;
  final String? hubungan; // 'ayah' atau 'ibu'
  final String? namaWali;

  SantriModel({
    required this.id,
    required this.nis,
    required this.nama,
    required this.jenisKelamin,
    this.kelas,
    this.asrama,
    this.fotoUrl,
    this.saldoDompet = 0,
    this.limitHarian,
    this.hubungan,
    this.namaWali,
  });

  factory SantriModel.fromJson(Map<String, dynamic> json) {
    return SantriModel(
      id: json['id']?.toString() ?? '',
      nis: json['nis'] ?? '',
      nama: json['nama'] ?? '',
      jenisKelamin: json['jenis_kelamin'] ?? '',
      kelas: json['kelas'],
      asrama: json['asrama'],
      fotoUrl: json['foto_url'],
      saldoDompet: json['saldo_dompet'] != null 
          ? double.parse(json['saldo_dompet'].toString()) 
          : 0,
        limitHarian: json['limit_harian'] != null
          ? double.tryParse(json['limit_harian'].toString())
          : null,
      hubungan: json['hubungan'],
      namaWali: json['nama_wali'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nis': nis,
      'nama': nama,
      'jenis_kelamin': jenisKelamin,
      'kelas': kelas,
      'asrama': asrama,
      'foto_url': fotoUrl,
      'saldo_dompet': saldoDompet,
      'limit_harian': limitHarian,
      'hubungan': hubungan,
      'nama_wali': namaWali,
    };
  }
}
