class BankAccount {
  final int id;
  final String bankName;
  final String accountNumber;
  final String accountName;

  BankAccount({
    required this.id,
    required this.bankName,
    required this.accountNumber,
    required this.accountName,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: json['id'] as int,
      bankName: json['bank_name'] as String,
      accountNumber: json['account_number'] as String,
      accountName: json['account_name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bank_name': bankName,
      'account_number': accountNumber,
      'account_name': accountName,
    };
  }
}
