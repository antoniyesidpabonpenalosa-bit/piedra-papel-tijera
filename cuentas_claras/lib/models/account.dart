class Payment {
  final String id;
  final String accountId;
  final double amount;
  final DateTime date;

  Payment({
    required this.id,
    required this.accountId,
    required this.amount,
    required this.date,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'accountId': accountId,
      'amount': amount,
      'date': date.toIso8601String(),
    };
  }

  factory Payment.fromMap(Map<String, dynamic> map) {
    return Payment(
      id: map['id'],
      accountId: map['accountId'],
      amount: (map['amount'] as num).toDouble(),
      date: DateTime.parse(map['date']),
    );
  }
}

class Account {
  final String id;
  final String clientId;
  final String clientName;
  final double total;
  final double paid;
  final DateTime date;
  final String? saleId;

  Account({
    required this.id,
    required this.clientId,
    required this.clientName,
    required this.total,
    required this.paid,
    required this.date,
    this.saleId,
  });

  double get pending => total - paid;
  bool get isPaid => pending <= 0;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clientId': clientId,
      'clientName': clientName,
      'total': total,
      'paid': paid,
      'date': date.toIso8601String(),
      'saleId': saleId,
    };
  }

  factory Account.fromMap(Map<String, dynamic> map) {
    return Account(
      id: map['id'],
      clientId: map['clientId'],
      clientName: map['clientName'],
      total: (map['total'] as num).toDouble(),
      paid: (map['paid'] as num).toDouble(),
      date: DateTime.parse(map['date']),
      saleId: map['saleId'],
    );
  }
}
