import 'package:flutter/material.dart';
import 'package:simpels_mobile/models/bank_account.dart';

class BankSelector extends StatelessWidget {
  final List<BankAccount> bankAccounts;
  final BankAccount? selectedBank;
  final void Function(BankAccount) onSelect;
  final void Function(String) onCopy;

  const BankSelector({
    super.key,
    required this.bankAccounts,
    required this.selectedBank,
    required this.onSelect,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Transfer ke Rekening', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...bankAccounts.map((bank) => _BankCard(
          bank: bank,
          isSelected: selectedBank?.id == bank.id,
          onSelect: () => onSelect(bank),
          onCopy: () => onCopy(bank.accountNumber),
        )),
      ],
    );
  }
}

class _BankCard extends StatelessWidget {
  final BankAccount bank;
  final bool isSelected;
  final VoidCallback onSelect;
  final VoidCallback onCopy;

  const _BankCard({
    required this.bank,
    required this.isSelected,
    required this.onSelect,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelect,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? Colors.blue.shade50 : Colors.white,
        ),
        child: Row(
          children: [
            Radio<int>(
              value: bank.id,
              groupValue: isSelected ? bank.id : null,
              onChanged: (_) => onSelect(),
              activeColor: Colors.blue,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(bank.bankName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(bank.accountNumber, style: const TextStyle(fontFamily: 'monospace', fontSize: 15, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text('a.n. ${bank.accountName}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.copy, size: 20),
              onPressed: onCopy,
              tooltip: 'Salin nomor rekening',
              color: Colors.blue,
            ),
          ],
        ),
      ),
    );
  }
}
