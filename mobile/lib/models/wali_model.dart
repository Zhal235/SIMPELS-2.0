class WaliModel {
  final String noHp;
  final String nama;
  final String tipe; // 'ayah' atau 'ibu'
  final String? label; // 'Ayah dari Ahmad Zaki'

  WaliModel({
    required this.noHp,
    required this.nama,
    required this.tipe,
    this.label,
  });

  factory WaliModel.fromJson(Map<String, dynamic> json) {
    return WaliModel(
      noHp: json['no_hp'] ?? '',
      nama: json['nama'] ?? '',
      tipe: json['tipe'] ?? 'ayah',
      label: json['label'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'no_hp': noHp,
      'nama': nama,
      'tipe': tipe,
      'label': label,
    };
  }
}
