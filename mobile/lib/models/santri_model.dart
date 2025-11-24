class SantriModel {
  final int id;
  final String nis;
  final String nama;
  final String jenisKelamin;
  final String? kelas;
  final String? asrama;
  final String? fotoUrl;
  final double? saldoDompet;

  SantriModel({
    required this.id,
    required this.nis,
    required this.nama,
    required this.jenisKelamin,
    this.kelas,
    this.asrama,
    this.fotoUrl,
    this.saldoDompet,
  });

  factory SantriModel.fromJson(Map<String, dynamic> json) {
    return SantriModel(
      id: json['id'] ?? 0,
      nis: json['nis'] ?? '',
      nama: json['nama'] ?? '',
      jenisKelamin: json['jenis_kelamin'] ?? '',
      kelas: json['kelas'],
      asrama: json['asrama'],
      fotoUrl: json['foto_url'],
      saldoDompet: json['saldo_dompet'] != null 
          ? double.parse(json['saldo_dompet'].toString()) 
          : null,
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
    };
  }
}
