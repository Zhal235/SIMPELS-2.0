class WaliModel {
  final int id;
  final String nama;
  final String email;
  final String? noHp;
  final String? alamat;

  WaliModel({
    required this.id,
    required this.nama,
    required this.email,
    this.noHp,
    this.alamat,
  });

  factory WaliModel.fromJson(Map<String, dynamic> json) {
    return WaliModel(
      id: json['id'] ?? 0,
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      noHp: json['no_hp'],
      alamat: json['alamat'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'email': email,
      'no_hp': noHp,
      'alamat': alamat,
    };
  }
}
