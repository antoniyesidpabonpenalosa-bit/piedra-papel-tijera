class SaleItem {
  final String productId;
  final String productName;
  final double price;
  final double cost;
  final int quantity;

  SaleItem({
    required this.productId,
    required this.productName,
    required this.price,
    required this.cost,
    required this.quantity,
  });

  double get total => price * quantity;
  double get profit => (price - cost) * quantity;

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'productName': productName,
      'price': price,
      'cost': cost,
      'quantity': quantity,
    };
  }

  factory SaleItem.fromMap(Map<String, dynamic> map) {
    return SaleItem(
      productId: map['productId'],
      productName: map['productName'],
      price: (map['price'] as num).toDouble(),
      cost: (map['cost'] as num).toDouble(),
      quantity: map['quantity'] as int,
    );
  }
}

class Sale {
  final String id;
  final List<SaleItem> items;
  final double total;
  final double totalProfit;
  final DateTime date;
  final String type; // 'Directo' o 'A cuenta'
  final String? clientId;
  final String? clientName;
  final String sellerId;

  Sale({
    required this.id,
    required this.items,
    required this.total,
    required this.totalProfit,
    required this.date,
    required this.type,
    this.clientId,
    this.clientName,
    required this.sellerId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'total': total,
      'totalProfit': totalProfit,
      'date': date.toIso8601String(),
      'type': type,
      'clientId': clientId,
      'clientName': clientName,
      'sellerId': sellerId,
    };
  }

  factory Sale.fromMap(Map<String, dynamic> map, List<SaleItem> items) {
    return Sale(
      id: map['id'],
      items: items,
      total: (map['total'] as num).toDouble(),
      totalProfit: (map['totalProfit'] as num).toDouble(),
      date: DateTime.parse(map['date']),
      type: map['type'],
      clientId: map['clientId'],
      clientName: map['clientName'],
      sellerId: map['sellerId'],
    );
  }
}
