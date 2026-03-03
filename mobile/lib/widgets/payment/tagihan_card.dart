import 'package:flutter/material.dart';

class TagihanCard extends StatelessWidget {
  final Map<String, dynamic> tagihan;
  final bool isSelected;
  final bool canSelect;
  final bool hasPendingBukti; 
  final bool isInDraft;
  final Function(int) onToggleSelection;

  const TagihanCard({
    super.key,
    required this.tagihan,
    required this.isSelected,
    required this.canSelect,
    required this.hasPendingBukti,
    required this.isInDraft,
    required this.onToggleSelection,
  });

  @override
  Widget build(BuildContext context) {
    final status = tagihan['status'] ?? '';
    final tagihanId = tagihan['id'] as int?;

    final Color statusColor;
    final String statusText;

    if (isInDraft) {
      statusColor = Colors.blue;
      statusText = 'DRAFT';
    } else if (hasPendingBukti) {
      statusColor = Colors.orange;
      statusText = 'PENDING';
    } else {
      switch (status) {
        case 'lunas':
          statusColor = Colors.green;
          statusText = 'LUNAS';
          break;
        case 'sebagian':
          statusColor = Colors.orange;
          statusText = 'SEBAGIAN';
          break;
        case 'belum_bayar':
        default:
          statusColor = Colors.red;
          statusText = 'BELUM BAYAR';
      }
    }

    final nominal = double.tryParse(tagihan['nominal'].toString()) ?? 0;
    final dibayar = double.tryParse(tagihan['dibayar'].toString()) ?? 0;
    final sisa = double.tryParse(tagihan['sisa'].toString()) ?? 0;
    final jenisTgh =
        tagihan['jenis_tagihan'] ?? tagihan['jenis_tagihan_id'] ?? 'Biaya';

    return GestureDetector(
      onTap: () {
        if (canSelect && tagihanId != null) {
          onToggleSelection(tagihanId);
        }
      },
      child: Opacity(
        opacity: (hasPendingBukti || isInDraft) ? 0.6 : 1.0,
        child: Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color:
              isSelected ? const Color(0xFF1976D2).withAlpha(26) : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (canSelect)
                      Checkbox(
                        value: isSelected,
                        onChanged: (bool? value) {
                          if (tagihanId != null) {
                            onToggleSelection(tagihanId);
                          }
                        },
                        activeColor: const Color(0xFF1976D2),
                      ),
                    if (hasPendingBukti)
                      const Padding(
                        padding: EdgeInsets.only(right: 8),
                        child: Icon(Icons.schedule,
                            color: Colors.orange, size: 20),
                      ),
                    Expanded(
                      child: Text(
                        jenisTgh.toString(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha(26),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                if (tagihan['deskripsi'] != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    tagihan['deskripsi'],
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Flexible(
                      child: Row(
                        children: [
                          if (tagihan['bulan'] != null) ...[
                            Icon(Icons.calendar_month,
                                size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                '${tagihan['bulan']} ${tagihan['tahun']}',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600]),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (tagihan['jatuh_tempo'] != null) ...[
                            Icon(Icons.event,
                                size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                'Jatuh tempo: ${tagihan['jatuh_tempo']}',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600]),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey[600])),
                          const SizedBox(height: 4),
                          Text(
                            'Rp ${_formatCurrency(nominal)}',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      if (dibayar > 0) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Terbayar',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600])),
                            const SizedBox(height: 4),
                            Text(
                              'Rp ${_formatCurrency(dibayar)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (sisa > 0) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('Sisa',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600])),
                            const SizedBox(height: 4),
                            Text(
                              'Rp ${_formatCurrency(sisa)}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: status == 'sebagian'
                                    ? Colors.orange
                                    : Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
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