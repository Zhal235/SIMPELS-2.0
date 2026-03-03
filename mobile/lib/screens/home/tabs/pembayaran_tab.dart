import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/services/api_service.dart';
import 'package:simpels_mobile/widgets/payment/draft_pembayaran_list.dart';
import 'package:simpels_mobile/widgets/payment/tagihan_list.dart';

class PembayaranTab extends StatefulWidget {
  const PembayaranTab({super.key});

  @override
  State<PembayaranTab> createState() => _PembayaranTabState();
}

class _PembayaranTabState extends State<PembayaranTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  Map<String, dynamic>? _tagihanData;
  final Set<int> _selectedTagihanIds = {};
  bool _showFutureTagihan = false;
  bool get _isSelectionMode => _selectedTagihanIds.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadTagihan();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _toggleSelection(int tagihanId) {
    setState(() {
      if (_selectedTagihanIds.contains(tagihanId)) {
        _selectedTagihanIds.remove(tagihanId);
      } else {
        _selectedTagihanIds.add(tagihanId);
      }
    });
  }

  double _calculateTotal() {
    if (_tagihanData == null) return 0;

    double total = 0;
    final allTagihan = _tagihanData!['data']?['semua'] ?? [];

    for (var tagihan in allTagihan) {
      if (_selectedTagihanIds.contains(tagihan['id'])) {
        final sisa = double.tryParse(tagihan['sisa'].toString()) ?? 0;
        total += sisa;
      }
    }
    return total;
  }

  Future<void> _loadTagihan() async {
    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final santriId = authProvider.activeSantri?.id;

    if (santriId == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final apiService = ApiService();
      final response = await apiService.getAllTagihan(santriId);

      if (response.statusCode == 200) {
        final responseBody = response.data;
        debugPrint('[_loadTagihan] Response: ${responseBody.runtimeType}');

        if (responseBody is Map && responseBody['success'] == true) {
          if (mounted) {
            setState(() {
              _tagihanData = Map<String, dynamic>.from(responseBody);
              _isLoading = false;
            });
          }
          debugPrint('[_loadTagihan] Data loaded successfully');
          _cleanupApprovedDrafts(santriId);
        } else {
          throw Exception('Invalid response format');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error loading tagihan: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _cleanupApprovedDrafts(String santriId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final apiService = ApiService();

      final response = await apiService.getBuktiHistory(santriId);

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData['success'] == true) {
          final buktiList = responseData['data'] as List;

          final processedBukti = buktiList
              .where((b) => b['status'] == 'approved' || b['status'] == 'rejected')
              .toList();

          for (final bukti in processedBukti) {
            final tagihanIds = (bukti['tagihan'] as List?)
                ?.map((t) => t['id'])
                .where((id) => id != null)
                .cast<int>()
                .toList();

            if (tagihanIds == null || tagihanIds.isEmpty) continue;

            final draftKeys = prefs
                .getKeys()
                .where((key) =>
                    key.startsWith('payment_draft_$santriId') ||
                    key.startsWith('payment_draft_multiple_$santriId'))
                .toList();

            for (final key in draftKeys) {
              if (key.contains('payment_draft_multiple_')) {
                final draftJson = prefs.getString(key);
                if (draftJson != null) {
                  try {
                    final draft = json.decode(draftJson);
                    if (draft['tagihan'] is List) {
                      final draftTagihanIds = (draft['tagihan'] as List)
                          .map((t) => t['id'])
                          .where((id) => id != null)
                          .cast<int>()
                          .toList();

                      if (draftTagihanIds
                          .any((id) => tagihanIds.contains(id))) {
                        await prefs.remove(key);
                        debugPrint('[Cleanup] Removed multiple draft: $key');
                      }
                    }
                  } catch (e) {
                    debugPrint('[Cleanup] Error parsing multiple draft: $e');
                  }
                }
              } else {
                final parts = key.split('_');
                if (parts.length >= 4) {
                  final draftTagihanId = int.tryParse(parts.last);
                  if (draftTagihanId != null &&
                      tagihanIds.contains(draftTagihanId)) {
                    await prefs.remove(key);
                    debugPrint('[Cleanup] Removed single draft: $key');
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[Cleanup] Error cleaning up drafts: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalSelected = _calculateTotal();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: _isSelectionMode
            ? Text('${_selectedTagihanIds.length} dipilih')
            : const Text('Pembayaran'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: _isSelectionMode
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _selectedTagihanIds.clear();
                  });
                },
              )
            : null,
        actions: _isSelectionMode
            ? null
            : [
                IconButton(
                  icon: Icon(_showFutureTagihan
                      ? Icons.visibility_off
                      : Icons.visibility),
                  onPressed: () {
                    setState(() {
                      _showFutureTagihan = !_showFutureTagihan;
                    });
                  },
                  tooltip: _showFutureTagihan
                      ? 'Sembunyikan tagihan bulan depan'
                      : 'Tampilkan tagihan bulan depan',
                ),
              ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Semua'),
            Tab(text: 'Lunas'),
            Tab(text: 'Belum Bayar'),
            Tab(text: 'Draft'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              key: ValueKey('tagihan_view_$_showFutureTagihan'),
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadTagihan,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        TagihanList(
                          tagihan: _tagihanData!['data']['semua'] ?? [],
                          selectedTagihanIds: _selectedTagihanIds,
                          showFutureTagihan: _showFutureTagihan,
                          onToggleSelection: _toggleSelection,
                          onToggleFuture: () {
                            setState(() {
                              _showFutureTagihan = !_showFutureTagihan;
                            });
                          },
                        ),
                        TagihanList(
                          tagihan: _tagihanData!['data']['lunas'] ?? [],
                          selectedTagihanIds: _selectedTagihanIds,
                          showFutureTagihan: _showFutureTagihan,
                          onToggleSelection: _toggleSelection,
                          onToggleFuture: () {
                            setState(() {
                              _showFutureTagihan = !_showFutureTagihan;
                            });
                          },
                        ),
                        TagihanList(
                          tagihan: _tagihanData!['data']['belum_bayar'] ?? [],
                          selectedTagihanIds: _selectedTagihanIds,
                          showFutureTagihan: _showFutureTagihan,
                          onToggleSelection: _toggleSelection,
                          onToggleFuture: () {
                            setState(() {
                              _showFutureTagihan = !_showFutureTagihan;
                            });
                          },
                        ),
                        const DraftPembayaranList(),
                      ],
                    ),
                  ),
                ),
                if (_isSelectionMode)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(16),
                    child: SafeArea(
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${_selectedTagihanIds.length} tagihan dipilih',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Total: Rp ${_formatCurrency(totalSelected)}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1976D2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: totalSelected > 0
                                ? () {
                                    _navigateToPayment();
                                  }
                                : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1976D2),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 12),
                            ),
                            child: const Text('Bayar'),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  void _navigateToPayment() {
    final selectedTagihan = _getSelectedTagihan();
    if (selectedTagihan.isNotEmpty) {
      if (selectedTagihan.length == 1) {
        Navigator.of(context).pushNamed('/single-payment', arguments: selectedTagihan.first);
      } else {
        Navigator.of(context).pushNamed('/multiple-payment', arguments: selectedTagihan);
      }
    }
  }

  List<Map<String, dynamic>> _getSelectedTagihan() {
    if (_tagihanData == null) return [];

    try {
      final List<dynamic> allTagihan = [];
      final data = _tagihanData!['data'];
      
      if (data != null && data is Map) {
        if (data['semua'] is List) {
          allTagihan.addAll(data['semua']);
        }
        if (data['lunas'] is List) {  
          allTagihan.addAll(data['lunas']);
        }
        if (data['belum_bayar'] is List) {
          allTagihan.addAll(data['belum_bayar']);
        }
      }

      final Map<int, Map<String, dynamic>> uniqueTagihan = {};
      for (var item in allTagihan) {
        if (item is Map) {
          final id = item['id'];
          if (id != null && !uniqueTagihan.containsKey(id)) {
            uniqueTagihan[id] = Map<String, dynamic>.from(item);
          }
        }
      }

      return uniqueTagihan.values
          .where((t) => _selectedTagihanIds.contains(t['id']))
          .toList();
    } catch (e) {
      debugPrint('Error in _getSelectedTagihan: $e');
      return [];
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}
