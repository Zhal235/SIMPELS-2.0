import '../services/api_service.dart';

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
  final double? minimumBalance;
  final bool isBelowMinimum;
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
    this.minimumBalance,
    this.isBelowMinimum = false,
    this.hubungan,
    this.namaWali,
  });

  factory SantriModel.fromJson(Map<String, dynamic> json) {
    // Parse limit_harian dengan fallback ke 15000 jika null
    final limitHarianValue = json['limit_harian'] != null
        ? double.tryParse(json['limit_harian'].toString()) ?? 15000.0
        : 15000.0;

    // Convert relative foto_url to full URL
    final relativeFotoUrl = json['foto_url'];
    String? fullFotoUrl;

    if (relativeFotoUrl != null && relativeFotoUrl.toString().isNotEmpty) {
      final fotoStr = relativeFotoUrl.toString();
      // If already a full URL, use it directly
      if (fotoStr.startsWith('http://') || fotoStr.startsWith('https://')) {
        fullFotoUrl = fotoStr;
      } else {
        // Convert relative path to full URL
        fullFotoUrl = ApiService.getFullImageUrl(fotoStr);
      }
      // Debug logging removed for production
    }

    return SantriModel(
      id: json['id']?.toString() ?? '',
      nis: json['nis'] ?? '',
      nama: json['nama'] ?? '',
      jenisKelamin: json['jenis_kelamin'] ?? '',
      kelas: json['kelas'],
      asrama: json['asrama'],
      fotoUrl: fullFotoUrl,
      saldoDompet: json['saldo_dompet'] != null
          ? double.parse(json['saldo_dompet'].toString())
          : 0,
      limitHarian: limitHarianValue,
      minimumBalance: json['minimum_balance'] != null
          ? double.parse(json['minimum_balance'].toString())
          : null,
      isBelowMinimum: json['is_below_minimum'] == true || json['is_below_minimum'] == 1,
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
      'minimum_balance': minimumBalance,
      'is_below_minimum': isBelowMinimum,
      'hubungan': hubungan,
      'nama_wali': namaWali,
    };
  }
}
