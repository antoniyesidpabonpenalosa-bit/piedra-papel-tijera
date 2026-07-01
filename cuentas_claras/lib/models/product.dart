class Product {
  final String id;
  final String name;
  final double salePrice;
  final double cost;
  final int stock;
  final int minAlert;
  final String? barcode;
  final String? category;
  final String? imagePath;

  Product({
    required this.id,
    required this.name,
    required this.salePrice,
    required this.cost,
    required this.stock,
    this.minAlert = 5,
    this.barcode,
    this.category,
    this.imagePath,
  });

  double get profit => salePrice - cost;

  Product copyWith({
    String? id,
    String? name,
    double? salePrice,
    double? cost,
    int? stock,
    int? minAlert,
    String? barcode,
    String? category,
    String? imagePath,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      salePrice: salePrice ?? this.salePrice,
      cost: cost ?? this.cost,
      stock: stock ?? this.stock,
      minAlert: minAlert ?? this.minAlert,
      barcode: barcode ?? this.barcode,
      category: category ?? this.category,
      imagePath: imagePath ?? this.imagePath,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'salePrice': salePrice,
      'cost': cost,
      'stock': stock,
      'minAlert': minAlert,
      'barcode': barcode,
      'category': category,
      'imagePath': imagePath,
    };
  }

  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'],
      name: map['name'],
      salePrice: (map['salePrice'] as num).toDouble(),
      cost: (map['cost'] as num).toDouble(),
      stock: map['stock'] as int,
      minAlert: map['minAlert'] as int? ?? 5,
      barcode: map['barcode'],
      category: map['category'],
      imagePath: map['imagePath'],
    );
  }
}
