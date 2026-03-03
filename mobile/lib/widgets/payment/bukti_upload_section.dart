import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:io';

class BuktiUploadSection extends StatelessWidget {
  final File? selectedFile;
  final Uint8List? webImage;
  final VoidCallback onPickImage;
  final VoidCallback onRemoveImage;

  const BuktiUploadSection({
    super.key,
    required this.selectedFile,
    required this.webImage,
    required this.onPickImage,
    required this.onRemoveImage,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Bukti Transfer',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Upload bukti transfer dari bank/e-wallet',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        const SizedBox(height: 12),
        if (selectedFile != null || webImage != null)
          Container(
            width: double.infinity,
            height: 300,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: webImage != null
                      ? Image.memory(webImage!, width: double.infinity, height: 300, fit: BoxFit.cover)
                      : Image.file(selectedFile!, width: double.infinity, height: 300, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    style: IconButton.styleFrom(backgroundColor: Colors.black54),
                    onPressed: onRemoveImage,
                  ),
                ),
              ],
            ),
          )
        else
          InkWell(
            onTap: onPickImage,
            child: Container(
              width: double.infinity,
              height: 150,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300, width: 2),
                borderRadius: BorderRadius.circular(8),
                color: Colors.white,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.cloud_upload, size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 8),
                  Text(
                    'Tap untuk upload bukti transfer',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  if (kIsWeb)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '(Pilih gambar dari galeri)',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                      ),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
