import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'dart:typed_data';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class UploadBuktiScreen extends StatefulWidget {
  final List<dynamic> selectedTagihan;
  final double totalNominal;

  const UploadBuktiScreen({
    super.key,
    required this.selectedTagihan,
    required this.totalNominal,
  });

  @override
  State<UploadBuktiScreen> createState() => _UploadBuktiScreenState();
}

class _UploadBuktiScreenState extends State<UploadBuktiScreen> {
  File? _buktiImage;
  Uint8List? _webImage; // For web platform
  final _catatanController = TextEditingController();
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _catatanController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        if (kIsWeb) {
          // For web, read as bytes
          final bytes = await image.readAsBytes();
          setState(() {
            _webImage = bytes;
          });
        } else {
          // For mobile, use File
          setState(() {
            _buktiImage = File(image.path);
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error memilih gambar: $e')),
        );
      }
    }
  }

  Future<void> _uploadBukti() async {
    if (_buktiImage == null && _webImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih bukti transfer terlebih dahulu')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santriId = authProvider.activeSantri?.id;

      if (santriId == null) {
        throw Exception('Santri ID tidak ditemukan');
      }

      final apiService = ApiService();
      final tagihanIds = widget.selectedTagihan
          .map((t) {
            final data = t is Map ? t : {};
            return int.tryParse(data['id'].toString()) ?? 0;
          })
          .where((id) => id > 0)
          .toList();

      final response = await apiService.uploadBuktiTransfer(
        santriId: santriId,
        tagihanIds: tagihanIds,
        totalNominal: widget.totalNominal,
        buktiFile: kIsWeb ? null : _buktiImage,
        buktiBytes: kIsWeb ? _webImage : null,
        catatan: _catatanController.text,
      );

      debugPrint('[Upload] Response status: ${response.statusCode}');
      debugPrint('[Upload] Response data: ${response.data}');
      
      if (response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context, true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Bukti transfer berhasil dikirim! Tunggu konfirmasi admin.'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        final errorMsg = response.data?['message'] ?? response.data?['error'] ?? 'Gagal mengirim bukti transfer';
        throw Exception(errorMsg);
      }
    } catch (e) {
      debugPrint('[Upload] Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Bukti Transfer'),
        backgroundColor: const Color(0xFF1976D2),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary tagihan dipilih
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Tagihan yang akan dibayar:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...widget.selectedTagihan.map((tagihan) {
                      // Ensure tagihan is a Map
                      final data = tagihan is Map ? tagihan : {};
                      final jenis = data['jenis_tagihan'] ?? 'Biaya';
                      final bulan = data['bulan'] ?? '';
                      final tahun = data['tahun'] ?? '';
                      final sisa = double.tryParse(data['sisa'].toString()) ?? 0;
                      
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '$jenis - $bulan $tahun',
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                            Text(
                              'Rp ${sisa.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Rp ${widget.totalNominal.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1976D2),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Upload bukti
            const Text(
              'Bukti Transfer',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                  color: Colors.grey[100],
                ),
                child: _buktiImage == null && _webImage == null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey[400]),
                            const SizedBox(height: 8),
                            Text(
                              'Tap untuk pilih foto',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: kIsWeb && _webImage != null
                            ? Image.memory(
                                _webImage!,
                                fit: BoxFit.cover,
                              )
                            : _buktiImage != null
                                ? Image.file(
                                    _buktiImage!,
                                    fit: BoxFit.cover,
                                  )
                                : const SizedBox(),
                      ),
              ),
            ),
            if (_buktiImage != null || _webImage != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: TextButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Ganti foto'),
                ),
              ),
            const SizedBox(height: 24),

            // Catatan (optional)
            const Text(
              'Catatan (opsional)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _catatanController,
              maxLines: 3,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Contoh: Pembayaran 3 bulan sekaligus',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isUploading ? null : _uploadBukti,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1976D2),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isUploading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Kirim Bukti Transfer',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 20, color: Colors.blue[700]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Bukti transfer akan diverifikasi oleh admin. Status pembayaran akan berubah setelah disetujui.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue[900],
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
}
