class CashRegister {
  final String id;
  final double initialAmount;
  final DateTime openedAt;
  final DateTime? closedAt;
  final String openedBy;

  CashRegister({
    required this.id,
    required this.initialAmount,
    required this.openedAt,
    this.closedAt,
    required this.openedBy,
  });

  bool get isOpen => closedAt == null;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'initialAmount': initialAmount,
      'openedAt': openedAt.toIso8601String(),
      'closedAt': closedAt?.toIso8601String(),
      'openedBy': openedBy,
    };
  }

  factory CashRegister.fromMap(Map<String, dynamic> map) {
    return CashRegister(
      id: map['id'],
      initialAmount: (map['initialAmount'] as num).toDouble(),
      openedAt: DateTime.parse(map['openedAt']),
      closedAt: map['closedAt'] != null ? DateTime.parse(map['closedAt']) : null,
      openedBy: map['openedBy'],
    );
  }
}
