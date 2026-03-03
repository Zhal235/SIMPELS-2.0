import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/santri_model.dart';

class SantriHeaderCard extends StatelessWidget {
  final SantriModel? santri;

  const SantriHeaderCard({super.key, required this.santri});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.teal.shade100,
                borderRadius: BorderRadius.circular(12),
                image: santri?.fotoUrl != null && santri!.fotoUrl!.isNotEmpty
                    ? DecorationImage(image: NetworkImage(santri!.fotoUrl!), fit: BoxFit.cover)
                    : null,
              ),
              child: santri?.fotoUrl == null || santri!.fotoUrl!.isEmpty
                  ? const Icon(Icons.person, size: 48, color: Colors.teal)
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(santri?.nama ?? 'Santri', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('NIS: ${santri?.nis ?? '-'}', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Text(santri?.kelas ?? 'Kelas', style: TextStyle(fontSize: 12, color: Colors.green.shade800, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SantriDataSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const SantriDataSection({super.key, required this.title, required this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, color: Colors.teal, size: 24),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ]),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }
}

class SantriDataRow extends StatelessWidget {
  final String label;
  final String value;
  final bool editable;
  final void Function(String label, String value)? onEdit;

  const SantriDataRow({super.key, required this.label, required this.value, this.editable = true, this.onEdit});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 2, child: Text(label, style: TextStyle(fontSize: 14, color: Colors.grey.shade700, fontWeight: FontWeight.w500))),
          Expanded(flex: 3, child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
          if (editable)
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              color: Colors.teal,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: () => onEdit?.call(label, value),
            ),
        ],
      ),
    );
  }
}
