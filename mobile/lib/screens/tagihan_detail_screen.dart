import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class TagihanDetailScreen extends StatefulWidget {
  final Map<String, dynamic> tagihan;

  const TagihanDetailScreen({
    super.key,
    required this.tagihan,
  });

  @override
  State<TagihanDetailScreen> createState() => _TagihanDetailScreenState();
}

class _TagihanDetailScreenState extends State<TagihanDetailScreen> {
  File? _selectedFile;
  final TextEditingController _amountController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final sisa = double.tryParse(widget.tagihan['sisa'].toString()) ?? 0;
    _amountController.text = sisa.toStringAsFixed(0);
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null) {
      setState(() {
        _selectedFile = File(result.files.single.path!);
      });
    }
  }

  Future<void> _submitPayment() async {
    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih bukti transfer terlebih dahulu')),
      );
      return;
    }

    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Masukkan jumlah pembayaran yang valid')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santriId = authProvider.activeSantri?.id;
      final tagihanId = widget.tagihan['id'];

      if (santriId == null || tagihanId == null) {
        throw Exception('Data santri atau tagihan tidak valid');
      }

      // Prepare form data dengan file
      // TODO: Gunakan MultipartFile saat backend siap
      final apiService = ApiService();
      
      // Temporary: Submit to backend dengan form data
      final response = await apiService.submitPayment(
        santriId: santriId,
        tagihanId: tagihanId,
        amount: amount,
        buktiFile: _selectedFile!,
        metode: 'transfer',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pembayaran berhasil dikirim! Tunggu konfirmasi admin.'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Gagal submit pembayaran');
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
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.tagihan['status'] ?? '';
    final Color statusColor;
    final String statusText;

    switch (status) {
      case 'lunas':
        statusColor = Colors.green;
        statusText = 'LUNAS';
        break;
      case 'tunggakan':
        statusColor = Colors.red;
        statusText = 'TUNGGAKAN';
        break;
      case 'cicilan':
        statusColor = Colors.orange;
        statusText = 'CICILAN';
        break;
      default:
        statusColor = Colors.grey;
        statusText = 'BELUM BAYAR';
    }

    final jumlah = double.tryParse(widget.tagihan['jumlah'].toString()) ?? 0;
    final sudahDibayar = double.tryParse(widget.tagihan['sudah_dibayar'].toString()) ?? 0;
    final sisa = double.tryParse(widget.tagihan['sisa'].toString()) ?? 0;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Detail Tagihan'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: status == 'lunas'
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, size: 80, color: Colors.green),
                  const SizedBox(height: 16),
                  const Text(
                    'Tagihan Sudah Lunas',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Card
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.tagihan['jenis_tagihan'] ?? 'Unknown',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (widget.tagihan['bulan'] != null)
                                      Text(
                                        '${widget.tagihan['bulan']} ${widget.tagihan['tahun']}',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  statusText,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: statusColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Breakdown Section
                  Text(
                    'Rincian',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  _buildBreakdownRow('Total Tagihan', jumlah),
                  _buildBreakdownRow('Sudah Dibayar', sudahDibayar, color: Colors.green),
                  const Divider(height: 24),
                  _buildBreakdownRow(
                    'Sisa Tagihan',
                    sisa,
                    color: status == 'tunggakan' ? Colors.red : Colors.orange,
                    isBold: true,
                  ),

                  const SizedBox(height: 32),

                  if (sisa > 0) ...[
                    // Payment Section
                    Text(
                      'Metode Pembayaran: Transfer Bank',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Masukkan jumlah pembayaran dan upload bukti transfer:',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 16),

                    // Amount Input
                    TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Jumlah Pembayaran (Rp)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixText: 'Rp ',
                      ),
                    ),
                    const SizedBox(height: 16),

                    // File Picker
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          if (_selectedFile == null)
                            Column(
                              children: [
                                Icon(
                                  Icons.cloud_upload_outlined,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 8),
                                const Text('Pilih file bukti transfer'),
                                const SizedBox(height: 8),
                                Text(
                                  '(JPG, PNG, PDF)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            )
                          else
                            Column(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 48,
                                  color: Colors.green,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _selectedFile!.path.split('/').last,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : _pickFile,
                            child: Text(
                              _selectedFile == null
                                  ? 'Pilih File'
                                  : 'Ganti File',
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitPayment,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor:
                              Theme.of(context).colorScheme.primary,
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Text(
                                'Kirim Pembayaran',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildBreakdownRow(
    String label,
    double amount, {
    Color? color,
    bool isBold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            'Rp ${_formatCurrency(amount)}',
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}
