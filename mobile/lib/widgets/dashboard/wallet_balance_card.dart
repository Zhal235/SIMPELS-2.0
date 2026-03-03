import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/santri_model.dart';

class WalletBalanceCard extends StatelessWidget {
  final SantriModel? santri;
  final VoidCallback onTap;
  final String Function(double) formatCurrency;

  const WalletBalanceCard({
    super.key,
    required this.santri,
    required this.onTap,
    required this.formatCurrency,
  });

  @override
  Widget build(BuildContext context) {
    final isBelowMinimum = santri?.isBelowMinimum ?? false;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isBelowMinimum
                  ? [Colors.red.shade400, Colors.red.shade600]
                  : [Colors.green.shade400, Colors.green.shade600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.account_balance_wallet, color: Colors.white.withAlpha(230), size: 24),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Saldo Dompet',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 14, color: Colors.white.withAlpha(230)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Rp ${formatCurrency(santri?.saldoDompet ?? 0)}',
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.trending_up, size: 16, color: Colors.white.withAlpha(230)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'Limit Harian: Rp ${formatCurrency(santri?.limitHarian ?? 15000)}',
                        style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(230), fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 12, color: Colors.white.withAlpha(230)),
                  ],
                ),
              ),
              if (isBelowMinimum) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white.withAlpha(51), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Saldo di bawah minimum (Rp ${formatCurrency(santri?.minimumBalance ?? 10000)}). Segera top-up!',
                          style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
