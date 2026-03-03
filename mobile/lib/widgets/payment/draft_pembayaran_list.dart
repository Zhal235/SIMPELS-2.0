import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DraftPembayaranList extends StatefulWidget {
  const DraftPembayaranList({super.key});

  @override
  State<DraftPembayaranList> createState() => _DraftPembayaranListState();
}

class _DraftPembayaranListState extends State<DraftPembayaranList> {
  List<Map<String, dynamic>> _drafts = [];

  @override
  void initState() {
    super.initState();
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs
        .getKeys()
        .where((key) => key.startsWith('payment_draft_'))
        .toList();

    final List<Map<String, dynamic>> drafts = [];
    for (final key in keys) {
      final draftJson = prefs.getString(key);
      if (draftJson != null) {
        try {
          final draft = json.decode(draftJson);
          draft['key'] = key;

          if (draft['isMultiple'] == true) {
            debugPrint('[Load Draft] Multiple payment draft found');
            debugPrint(
                '[Load Draft] Tagihan count: ${draft['tagihan']?.length ?? 0}');
            debugPrint('[Load Draft] Topup: ${draft['topupAmount']}');
          }

          drafts.add(draft);
        } catch (e) {
          debugPrint('Error parsing draft: $e');
        }
      }
    }

    drafts.sort((a, b) {
      final aTime = DateTime.tryParse(a['timestamp'] ?? '') ?? DateTime.now();
      final bTime = DateTime.tryParse(b['timestamp'] ?? '') ?? DateTime.now();
      return bTime.compareTo(aTime);
    });

    if (mounted) {
      setState(() => _drafts = drafts);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_drafts.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadDrafts,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height - 200,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.drafts_outlined,
                        size: 80, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Tidak ada draft pembayaran',
                      style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Draft akan tersimpan otomatis saat Anda keluar\ndari halaman pembayaran sebelum upload bukti',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadDrafts,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _drafts.length,
        itemBuilder: (context, index) {
          final draft = _drafts[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(draft['jenisTagihan'] ?? 'Draft Pembayaran'),
              subtitle: Text('Total: Rp ${draft['paymentAmount'] ?? 0}'),
              leading: const Icon(Icons.drafts, color: Colors.orange),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                _handleDraftTap(draft);
              },
            ),
          );
        },
      ),
    );
  }

  void _handleDraftTap(Map<String, dynamic> draft) {
    if (draft['isMultiple'] == true) {
      Navigator.of(context).pushNamed('/multiple-payment-draft', arguments: draft);
    } else {
      Navigator.of(context).pushNamed('/single-payment-draft', arguments: draft);
    }
  }
}