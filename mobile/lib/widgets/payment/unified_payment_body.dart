import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:simpels_mobile/widgets/common/announcement_badge.dart';
import 'package:simpels_mobile/widgets/payment/payment_info_card.dart';
import 'package:simpels_mobile/widgets/payment/nominal_summary_card.dart';
import 'package:simpels_mobile/widgets/payment/bukti_upload_section.dart';

class UnifiedPaymentBody extends StatelessWidget {
  final Map<String, dynamic>? tagihan;
  final bool isTopupOnly;
  final bool isMultiplePayment;
  final List<dynamic>? multipleTagihan;
  final String? santriName;
  final double paymentAmount;
  final double topupAmount;
  final double tabunganAmount;
  final File? selectedFile;
  final Uint8List? webImage;
  final TextEditingController catatanController;
  final bool isSubmitting;
  final VoidCallback onPickImage;
  final VoidCallback onRemoveImage;
  final VoidCallback onSubmit;
  final String Function(double) formatCurrency;

  const UnifiedPaymentBody({
    super.key,
    required this.tagihan,
    required this.isTopupOnly,
    required this.isMultiplePayment,
    required this.multipleTagihan,
    required this.santriName,
    required this.paymentAmount,
    required this.topupAmount,
    required this.tabunganAmount,
    required this.selectedFile,
    required this.webImage,
    required this.catatanController,
    required this.isSubmitting,
    required this.onPickImage,
    required this.onRemoveImage,
    required this.onSubmit,
    required this.formatCurrency,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(isTopupOnly ? 'Upload Bukti Top-up' : 'Pembayaran Tagihan'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: const [AnnouncementBadge()],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PaymentInfoCard(
              tagihan: tagihan,
              isTopupOnly: isTopupOnly,
              isMultiplePayment: isMultiplePayment,
              multipleTagihan: multipleTagihan,
              santriName: santriName,
              formatCurrency: formatCurrency,
            ),
            const SizedBox(height: 24),
            NominalSummaryCard(
              paymentAmount: paymentAmount,
              topupAmount: topupAmount,
              tabunganAmount: tabunganAmount,
              formatCurrency: formatCurrency,
            ),
            const SizedBox(height: 24),
            BuktiUploadSection(
              selectedFile: selectedFile,
              webImage: webImage,
              onPickImage: onPickImage,
              onRemoveImage: onRemoveImage,
            ),
            const SizedBox(height: 24),
            const Text(
              'Catatan (Opsional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: catatanController,
              maxLines: 3,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Tambahkan catatan jika diperlukan...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isSubmitting ? null : onSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        isTopupOnly ? 'Kirim Bukti Top-up' : 'Kirim Pembayaran',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
