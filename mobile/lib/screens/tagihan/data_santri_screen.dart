import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/widgets/santri/santri_data_widgets.dart';

class DataSantriScreen extends StatefulWidget {
  const DataSantriScreen({super.key});

  @override
  State<DataSantriScreen> createState() => _DataSantriScreenState();
}

class _DataSantriScreenState extends State<DataSantriScreen> {
  final _apiService = ApiService();
  Map<String, dynamic>? _santriDetail;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSantriDetail();
  }

  Future<void> _loadSantriDetail() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;

    if (santriId == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.getSantriDetail(santriId);

      if (response.data['success'] == true) {
        setState(() {
          _santriDetail = response.data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Gagal memuat data';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Terjadi kesalahan: $e';
        _isLoading = false;
      });
    }
  }

  void _showCorrectionDialog(String fieldName, String currentValue) {
    final controller = TextEditingController(text: currentValue);
    final noteController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Koreksi $fieldName'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: controller, decoration: const InputDecoration(labelText: 'Nilai yang benar', border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: noteController, maxLines: 3, decoration: const InputDecoration(labelText: 'Catatan (opsional)', hintText: 'Jelaskan alasan koreksi...', border: OutlineInputBorder())),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); _submitCorrection(fieldName, currentValue, controller.text, noteController.text); },
            child: const Text('Kirim Koreksi'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitCorrection(String fieldName, String oldValue, String newValue, String note) async {
    if (newValue.isEmpty || newValue == oldValue) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nilai tidak berubah')));
      return;
    }
    final santriId = Provider.of<AuthProvider>(context, listen: false).activeSantri?.id;
    if (santriId == null) return;
    try {
      final response = await _apiService.submitDataCorrection(santriId: santriId, fieldName: fieldName, oldValue: oldValue, newValue: newValue, note: note);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(response.data['success'] == true
              ? 'Permintaan koreksi berhasil dikirim. Menunggu persetujuan admin.'
              : (response.data['message'] ?? 'Gagal mengirim koreksi')),
          backgroundColor: response.data['success'] == true ? Colors.green : Colors.red,
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    }
  }

  Widget _row(String label, String value, {bool editable = true}) =>
      SantriDataRow(label: label, value: value, editable: editable, onEdit: _showCorrectionDialog);

  @override
  Widget build(BuildContext context) {
    final santri = Provider.of<AuthProvider>(context).activeSantri;

    return Scaffold(
      appBar: AppBar(title: const Text('Data Santri'), backgroundColor: Colors.teal, foregroundColor: Colors.white),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_errorMessage!),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _loadSantriDetail, child: const Text('Coba Lagi')),
                ]))
              : RefreshIndicator(
                  onRefresh: _loadSantriDetail,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: _santriDetail == null ? const SizedBox.shrink() : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SantriHeaderCard(santri: santri),
                        const SizedBox(height: 16),
                        SantriDataSection(title: 'Biodata Santri', icon: Icons.person, children: [
                          _row('NIS', _santriDetail!['nis'] ?? '-', editable: false),
                          _row('Nama Lengkap', _santriDetail!['nama_santri'] ?? '-'),
                          _row('Jenis Kelamin', _santriDetail!['jenis_kelamin'] ?? '-'),
                          _row('Tempat Lahir', _santriDetail!['tempat_lahir'] ?? '-'),
                          _row('Tanggal Lahir', _santriDetail!['tanggal_lahir'] ?? '-'),
                          _row('NIK', _santriDetail!['nik'] ?? '-'),
                          _row('No KK', _santriDetail!['no_kk'] ?? '-'),
                          _row('Alamat', _santriDetail!['alamat'] ?? '-'),
                        ]),
                        const SizedBox(height: 16),
                        SantriDataSection(title: 'Data Akademik', icon: Icons.school, children: [
                          _row('Kelas', _santriDetail!['kelas_nama'] ?? '-', editable: false),
                          _row('Asrama', _santriDetail!['asrama_nama'] ?? '-', editable: false),
                          _row('Status', _santriDetail!['status'] ?? '-', editable: false),
                        ]),
                        const SizedBox(height: 16),
                        SantriDataSection(title: 'Data Ayah', icon: Icons.person_outline, children: [
                          _row('Nama Ayah', _santriDetail!['nama_ayah'] ?? '-'),
                          _row('NIK Ayah', _santriDetail!['nik_ayah'] ?? '-'),
                          _row('HP Ayah', _santriDetail!['hp_ayah'] ?? '-'),
                          _row('Pekerjaan Ayah', _santriDetail!['pekerjaan_ayah'] ?? '-'),
                        ]),
                        const SizedBox(height: 16),
                        SantriDataSection(title: 'Data Ibu', icon: Icons.person_outline, children: [
                          _row('Nama Ibu', _santriDetail!['nama_ibu'] ?? '-'),
                          _row('NIK Ibu', _santriDetail!['nik_ibu'] ?? '-'),
                          _row('HP Ibu', _santriDetail!['hp_ibu'] ?? '-'),
                          _row('Pekerjaan Ibu', _santriDetail!['pekerjaan_ibu'] ?? '-'),
                        ]),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.blue.shade200)),
                          child: Row(children: [
                            Icon(Icons.info_outline, color: Colors.blue.shade700),
                            const SizedBox(width: 12),
                            Expanded(child: Text('Tap tombol edit di samping data untuk mengajukan koreksi. Admin akan meninjau perubahan yang Anda ajukan.', style: TextStyle(fontSize: 13, color: Colors.blue.shade900))),
                          ]),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
