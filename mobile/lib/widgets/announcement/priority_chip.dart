import 'package:flutter/material.dart';

class PriorityChip extends StatelessWidget {
  final String priority;

  const PriorityChip({super.key, required this.priority});

  @override
  Widget build(BuildContext context) {
    final LinearGradient gradient;
    final Color shadowColor;
    final IconData icon;
    final String label;

    switch (priority) {
      case 'urgent':
        gradient = const LinearGradient(colors: [Color(0xFFDC2626), Color(0xFFEF4444)]);
        shadowColor = Colors.red;
        icon = Icons.priority_high;
        label = 'Mendesak';
        break;
      case 'important':
        gradient = const LinearGradient(colors: [Color(0xFFEA580C), Color(0xFFF97316)]);
        shadowColor = Colors.orange;
        icon = Icons.warning_amber;
        label = 'Penting';
        break;
      default:
        gradient = const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF3B82F6)]);
        shadowColor = Colors.blue;
        icon = Icons.info_outline;
        label = 'Normal';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: shadowColor.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

Color priorityColor(String priority) {
  if (priority == 'urgent') return Colors.red;
  if (priority == 'important') return Colors.orange;
  return Colors.blue;
}

List<Color> priorityGradientColors(String priority) {
  if (priority == 'urgent') return [Colors.red[100]!, Colors.red[50]!];
  if (priority == 'important') return [Colors.orange[100]!, Colors.orange[50]!];
  return [Colors.blue[100]!, Colors.blue[50]!];
}

List<Color> priorityDetailGradient(String priority) {
  if (priority == 'urgent') return [Colors.red[50]!, Colors.red[100]!];
  if (priority == 'important') return [Colors.orange[50]!, Colors.orange[100]!];
  return [Colors.blue[50]!, Colors.blue[100]!];
}
