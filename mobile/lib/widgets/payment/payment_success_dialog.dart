import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/screens/bukti/bukti_history_screen.dart';

class PaymentSuccessDialog extends StatelessWidget {
  final String message;

  const PaymentSuccessDialog({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: const Icon(Icons.check_circle, color: Colors.green, size: 60),
      title: const Text('Upload Berhasil!'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 16),
          const Text(
            'Kami akan memverifikasi bukti transfer Anda. Anda akan menerima notifikasi setelah diproses.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            Navigator.pop(context, true);
          },
          child: const Text('Tutup'),
        ),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.pop(context);
            final santri = Provider.of<AuthProvider>(context, listen: false).activeSantri;
            if (santri != null) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => BuktiHistoryScreen(
                    santriId: santri.id,
                    santriName: santri.nama,
                  ),
                ),
              );
            } else {
              Navigator.pop(context, true);
            }
          },
          icon: const Icon(Icons.receipt_long, size: 18),
          label: const Text('Lihat Status'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }
}
