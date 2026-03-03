import 'package:flutter/material.dart';
import 'package:simpels_mobile/widgets/payment/month_group.dart';

class TagihanList extends StatelessWidget {
  final List<dynamic> tagihan;
  final Set<int> selectedTagihanIds;
  final bool showFutureTagihan;
  final Function(int) onToggleSelection;
  final Function() onToggleFuture;

  const TagihanList({
    super.key,
    required this.tagihan,
    required this.selectedTagihanIds,
    required this.showFutureTagihan,
    required this.onToggleSelection,
    required this.onToggleFuture,
  });

  @override
  Widget build(BuildContext context) {
    if (tagihan.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height - 300,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined,
                      size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Tidak ada data',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    final now = DateTime.now();
    final currentMonth = now.month;
    final currentYear = now.year;

    Map<String, List<dynamic>> currentAndPastTagihan = {};
    Map<String, List<dynamic>> futureTagihan = {};

    for (var item in tagihan) {
      final bulan = item['bulan'];
      final tahun = item['tahun'];

      String key;
      if (bulan != null && bulan.toString().isNotEmpty) {
        if (tahun != null && tahun.toString().isNotEmpty) {
          key = '${bulan.toString()} ${tahun.toString()}';
        } else {
          key = bulan.toString();
        }
      } else {
        key = 'Tanpa Bulan';
      }

      bool isFuture = false;
      if (bulan != null && tahun != null) {
        final bulanStr = bulan.toString();
        final monthIndex = _getMonthIndex(bulanStr);
        if (monthIndex != -1) {
          final itemYear = int.tryParse(tahun.toString()) ?? currentYear;
          final itemMonth = monthIndex + 1;

          if (itemYear > currentYear ||
              (itemYear == currentYear && itemMonth > currentMonth)) {
            isFuture = true;
          }
        }
      }

      final targetMap = isFuture ? futureTagihan : currentAndPastTagihan;
      if (!targetMap.containsKey(key)) {
        targetMap[key] = [];
      }
      targetMap[key]!.add(item);
    }

    final sortedCurrentKeys =
        _sortMonthKeys(currentAndPastTagihan.keys.toList());
    final sortedFutureKeys = _sortMonthKeys(futureTagihan.keys.toList());

    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        ...sortedCurrentKeys.map((monthKey) {
          final items = currentAndPastTagihan[monthKey]!;
          return MonthGroup(
            monthKey: monthKey,
            items: items,
            isFuture: false,
            selectedTagihanIds: selectedTagihanIds,
            onToggleSelection: onToggleSelection,
            checkIfInDraft: (id) => false,
          );
        }),

        if (futureTagihan.isNotEmpty) ...[
          GestureDetector(
            onTap: onToggleFuture,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              margin: const EdgeInsets.only(top: 8, bottom: 8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          showFutureTagihan
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          color: Colors.blue.shade700,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            showFutureTagihan
                                ? 'Sembunyikan Tagihan Bulan Depan'
                                : 'Tampilkan Tagihan Bulan Depan',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade700,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${sortedFutureKeys.length}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (showFutureTagihan) ...[
            ...sortedFutureKeys.map((monthKey) {
              final items = futureTagihan[monthKey]!;
              return MonthGroup(
                monthKey: monthKey,
                items: items,
                isFuture: true,
                selectedTagihanIds: selectedTagihanIds,
                onToggleSelection: onToggleSelection,
                checkIfInDraft: (id) => false,
              );
            }),
          ],
        ],
      ],
    );
  }

  int _getMonthIndex(String monthName) {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    return months.indexOf(monthName);
  }

  List<String> _sortMonthKeys(List<String> keys) {
    final monthOrder = [
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Tanpa Bulan'
    ];

    return keys
      ..sort((a, b) {
        final monthA = a.split(' ')[0];
        final monthB = b.split(' ')[0];
        final indexA = monthOrder.indexOf(monthA);
        final indexB = monthOrder.indexOf(monthB);

        if (indexA == -1 && indexB == -1) return a.compareTo(b);
        if (indexA == -1) return 1;
        if (indexB == -1) return -1;

        if (indexA == indexB) {
          final yearA =
              a.split(' ').length > 1 ? int.tryParse(a.split(' ')[1]) ?? 0 : 0;
          final yearB =
              b.split(' ').length > 1 ? int.tryParse(b.split(' ')[1]) ?? 0 : 0;
          return yearB.compareTo(yearA);
        }

        return indexA.compareTo(indexB);
      });
  }
}
