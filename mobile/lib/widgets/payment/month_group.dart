import 'package:flutter/material.dart';
import 'package:simpels_mobile/widgets/payment/tagihan_card.dart';

class MonthGroup extends StatelessWidget {
  final String monthKey;
  final List<dynamic> items;
  final bool isFuture;
  final Set<int> selectedTagihanIds;
  final Function(int) onToggleSelection;
  final Function(int?) checkIfInDraft;

  const MonthGroup({
    super.key,
    required this.monthKey,
    required this.items,
    required this.isFuture,
    required this.selectedTagihanIds,
    required this.onToggleSelection,
    required this.checkIfInDraft,
  });

  @override
  Widget build(BuildContext context) {
    double totalSisa = 0;
    int countBelumBayar = 0;

    for (var item in items) {
      final sisa = double.tryParse(item['sisa']?.toString() ?? '0') ?? 0;
      totalSisa += sisa;
      if (item['status'] == 'belum_bayar' || item['status'] == 'sebagian') {
        countBelumBayar++;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: isFuture
                ? Colors.blue.shade50
                : Theme.of(context).colorScheme.primary.withAlpha(26),
            borderRadius: BorderRadius.circular(8),
            border: isFuture ? Border.all(color: Colors.blue.shade200) : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    if (isFuture)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Icon(
                          Icons.schedule,
                          size: 18,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            monthKey,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isFuture
                                  ? Colors.blue.shade700
                                  : Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          Text(
                            '${items.length} tagihan${isFuture ? ' (Bulan Depan)' : ''}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (totalSisa > 0)
                    Text(
                      'Sisa: Rp ${_formatCurrency(totalSisa)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: countBelumBayar > 0 ? Colors.red : Colors.orange,
                      ),
                    ),
                  if (countBelumBayar > 0)
                    Text(
                      '$countBelumBayar belum lunas',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.red,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        ...items.map((item) => FutureBuilder<bool>(
              future: Future.value(_checkIfInDraft(item['id'])),
              builder: (context, snapshot) {
                final isInDraft = snapshot.data ?? false;
                final status = item['status'] ?? '';
                final tagihanId = item['id'] as int?;
                final hasPendingBukti = item['has_pending_bukti'] == true;
                final isSelected = tagihanId != null && selectedTagihanIds.contains(tagihanId);
                final canSelect = status != 'lunas' && !hasPendingBukti && !isInDraft;

                return TagihanCard(
                  tagihan: item,
                  isSelected: isSelected,
                  canSelect: canSelect,
                  hasPendingBukti: hasPendingBukti,
                  isInDraft: isInDraft,
                  onToggleSelection: onToggleSelection,
                );
              },
            )),
        const SizedBox(height: 16),
      ],
    );
  }

  bool _checkIfInDraft(int? tagihanId) {
    // This is a simplified version - the actual implementation should use SharedPreferences
    return false;
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}
