import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';

class DraftPaymentManager {
  final String? draftKey;
  final Map<String, dynamic>? tagihan;
  final int? selectedBankId;
  final bool isMultiplePayment;
  final bool fromDraft;
  final List<dynamic>? multipleTagihan;

  const DraftPaymentManager({
    required this.draftKey,
    required this.tagihan,
    required this.selectedBankId,
    required this.isMultiplePayment,
    required this.fromDraft,
    required this.multipleTagihan,
  });

  Future<void> save({
    required double paymentAmount,
    required double topupAmount,
    required String catatan,
  }) async {
    if (draftKey == null) return;

    final prefs = await SharedPreferences.getInstance();
    final jumlah = tagihan != null
        ? (double.tryParse(tagihan!['nominal']?.toString() ?? tagihan!['jumlah']?.toString() ?? '0') ?? 0.0)
        : 0.0;
    final sudahDibayar = tagihan != null
        ? (double.tryParse(tagihan!['dibayar']?.toString() ?? tagihan!['sudah_dibayar']?.toString() ?? '0') ?? 0.0)
        : 0.0;

    final draft = {
      'paymentAmount': paymentAmount,
      'topupAmount': topupAmount,
      'catatan': catatan,
      'timestamp': DateTime.now().toIso8601String(),
      'tagihanId': tagihan?['id'],
      'jenisTagihan': tagihan?['jenis_tagihan'],
      'bulan': tagihan?['bulan'],
      'tahun': tagihan?['tahun'],
      'selectedBankId': selectedBankId,
      'totalTagihan': jumlah,
      'sudahDibayar': sudahDibayar,
    };
    await prefs.setString(draftKey!, json.encode(draft));
  }

  Future<void> clear(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();

    if (draftKey != null) {
      await prefs.remove(draftKey!);
      debugPrint('[Clear Draft] Removed single payment draft: $draftKey');
    }

    if (isMultiplePayment && fromDraft && multipleTagihan != null) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final santriId = authProvider.activeSantri?.id;

      if (santriId != null) {
        final submittedIds = multipleTagihan!
            .map((t) => t is Map ? t['id'] as int? : null)
            .where((id) => id != null)
            .toSet();

        final keys = prefs.getKeys().where((k) => k.startsWith('payment_draft_multiple_$santriId')).toList();

        for (final key in keys) {
          final draftJson = prefs.getString(key);
          if (draftJson != null) {
            try {
              final draft = json.decode(draftJson);
              if (draft['tagihan'] is List) {
                final draftIds = (draft['tagihan'] as List)
                    .map((t) => t is Map ? t['id'] as int? : null)
                    .where((id) => id != null)
                    .toSet();
                if (draftIds.length == submittedIds.length && draftIds.containsAll(submittedIds)) {
                  await prefs.remove(key);
                  debugPrint('[Clear Draft] Removed matching multiple payment draft: $key');
                  break;
                }
              }
            } catch (e) {
              debugPrint('[Clear Draft] Error checking draft: $e');
            }
          }
        }
      }
    }
  }

  static void showDraftDialog(
    BuildContext context, {
    required VoidCallback onReset,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Pembayaran Tersimpan'),
        content: const Text(
          'Anda memiliki draft pembayaran yang belum selesai. Lanjutkan pembayaran atau mulai dari awal?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onReset();
            },
            child: const Text('Mulai Baru'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Lanjutkan'),
          ),
        ],
      ),
    );
  }
}
