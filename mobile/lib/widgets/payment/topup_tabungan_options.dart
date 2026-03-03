import 'package:flutter/material.dart';

class TopupTabunganOptions extends StatelessWidget {
  final bool includeTopup;
  final bool includeTabungan;
  final bool hasTabungan;
  final TextEditingController topupController;
  final TextEditingController tabunganController;
  final void Function(bool) onTopupChanged;
  final void Function(bool) onTabunganChanged;
  final VoidCallback onValueChanged;

  const TopupTabunganOptions({
    super.key,
    required this.includeTopup,
    required this.includeTabungan,
    required this.hasTabungan,
    required this.topupController,
    required this.tabunganController,
    required this.onTopupChanged,
    required this.onTabunganChanged,
    required this.onValueChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CheckboxListTile(
          value: includeTopup,
          onChanged: (val) => onTopupChanged(val ?? false),
          title: const Text('Sekaligus top-up dompet'),
          subtitle: const Text('Tambahkan saldo ke dompet santri'),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        ),
        if (includeTopup) ...[
          const SizedBox(height: 8),
          TextField(
            controller: topupController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Jumlah Top-up (Rp)',
              hintText: 'Minimal Rp 10.000',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              prefixText: 'Rp ',
              filled: true,
              fillColor: Colors.white,
            ),
            onChanged: (_) => onValueChanged(),
          ),
        ],
        if (hasTabungan) ...[
          const SizedBox(height: 8),
          CheckboxListTile(
            value: includeTabungan,
            onChanged: (val) => onTabunganChanged(val ?? false),
            title: const Text('Sekaligus setor tabungan'),
            subtitle: const Text('Tambah saldo tabungan santri'),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            activeColor: Colors.teal,
          ),
          if (includeTabungan) ...[
            const SizedBox(height: 8),
            TextField(
              controller: tabunganController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Jumlah Setor Tabungan (Rp)',
                hintText: 'Masukkan nominal',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                prefixText: 'Rp ',
                filled: true,
                fillColor: Colors.teal.shade50,
              ),
              onChanged: (_) => onValueChanged(),
            ),
          ],
        ],
      ],
    );
  }
}
