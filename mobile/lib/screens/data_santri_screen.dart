import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

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
      builder: (context) => AlertDialog(
        title: Text('Koreksi $fieldName'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Nilai yang benar',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: noteController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Catatan (opsional)',
                hintText: 'Jelaskan alasan koreksi...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitCorrection(fieldName, currentValue, controller.text,
                  noteController.text);
            },
            child: const Text('Kirim Koreksi'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitCorrection(
    String fieldName,
    String oldValue,
    String newValue,
    String note,
  ) async {
    if (newValue.isEmpty || newValue == oldValue) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nilai tidak berubah')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;

    if (santriId == null) return;

    try {
      final response = await _apiService.submitDataCorrection(
        santriId: santriId,
        fieldName: fieldName,
        oldValue: oldValue,
        newValue: newValue,
        note: note,
      );

      if (mounted) {
        if (response.data['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Permintaan koreksi berhasil dikirim. Menunggu persetujuan admin.'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(response.data['message'] ?? 'Gagal mengirim koreksi'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final santri = authProvider.activeSantri;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Data Santri'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_errorMessage!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadSantriDetail,
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadSantriDetail,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: _santriDetail != null
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header Card with Photo
                              _buildHeaderCard(santri),
                              const SizedBox(height: 16),

                              // Biodata Section
                              _buildSection(
                                'Biodata Santri',
                                Icons.person,
                                [
                                  _buildDataRow(
                                      'NIS', _santriDetail!['nis'] ?? '-',
                                      editable: false),
                                  _buildDataRow('Nama Lengkap',
                                      _santriDetail!['nama_santri'] ?? '-'),
                                  _buildDataRow('Jenis Kelamin',
                                      _santriDetail!['jenis_kelamin'] ?? '-'),
                                  _buildDataRow('Tempat Lahir',
                                      _santriDetail!['tempat_lahir'] ?? '-'),
                                  _buildDataRow('Tanggal Lahir',
                                      _santriDetail!['tanggal_lahir'] ?? '-'),
                                  _buildDataRow(
                                      'NIK', _santriDetail!['nik'] ?? '-'),
                                  _buildDataRow(
                                      'No KK', _santriDetail!['no_kk'] ?? '-'),
                                  _buildDataRow('Alamat',
                                      _santriDetail!['alamat'] ?? '-'),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Academic Section
                              _buildSection(
                                'Data Akademik',
                                Icons.school,
                                [
                                  _buildDataRow('Kelas',
                                      _santriDetail!['kelas_nama'] ?? '-',
                                      editable: false),
                                  _buildDataRow('Asrama',
                                      _santriDetail!['asrama_nama'] ?? '-',
                                      editable: false),
                                  _buildDataRow(
                                      'Status', _santriDetail!['status'] ?? '-',
                                      editable: false),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Parent Data (Ayah)
                              _buildSection(
                                'Data Ayah',
                                Icons.person_outline,
                                [
                                  _buildDataRow('Nama Ayah',
                                      _santriDetail!['nama_ayah'] ?? '-'),
                                  _buildDataRow('NIK Ayah',
                                      _santriDetail!['nik_ayah'] ?? '-'),
                                  _buildDataRow('HP Ayah',
                                      _santriDetail!['hp_ayah'] ?? '-'),
                                  _buildDataRow('Pekerjaan Ayah',
                                      _santriDetail!['pekerjaan_ayah'] ?? '-'),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Parent Data (Ibu)
                              _buildSection(
                                'Data Ibu',
                                Icons.person_outline,
                                [
                                  _buildDataRow('Nama Ibu',
                                      _santriDetail!['nama_ibu'] ?? '-'),
                                  _buildDataRow('NIK Ibu',
                                      _santriDetail!['nik_ibu'] ?? '-'),
                                  _buildDataRow('HP Ibu',
                                      _santriDetail!['hp_ibu'] ?? '-'),
                                  _buildDataRow('Pekerjaan Ibu',
                                      _santriDetail!['pekerjaan_ibu'] ?? '-'),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Info Card
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border:
                                      Border.all(color: Colors.blue.shade200),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.info_outline,
                                        color: Colors.blue.shade700),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Tap tombol edit di samping data untuk mengajukan koreksi. Admin akan meninjau perubahan yang Anda ajukan.',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.blue.shade900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : const SizedBox.shrink(),
                  ),
                ),
    );
  }

  Widget _buildHeaderCard(santri) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Photo
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.teal.shade100,
                borderRadius: BorderRadius.circular(12),
                image: santri?.fotoUrl != null && santri!.fotoUrl!.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(santri.fotoUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: santri?.fotoUrl == null || santri!.fotoUrl!.isEmpty
                  ? const Icon(Icons.person, size: 48, color: Colors.teal)
                  : null,
            ),
            const SizedBox(width: 16),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    santri?.nama ?? 'Santri',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'NIS: ${santri?.nis ?? '-'}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      santri?.kelas ?? 'Kelas',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green.shade800,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.teal, size: 24),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDataRow(String label, String value, {bool editable = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (editable)
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              color: Colors.teal,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: () => _showCorrectionDialog(label, value),
            ),
        ],
      ),
    );
  }
}
