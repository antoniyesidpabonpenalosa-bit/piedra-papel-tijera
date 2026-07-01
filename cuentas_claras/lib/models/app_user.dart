class AppUser {
  final String id;
  final String name;
  final String role; // 'Administrador', 'Cajero', 'Vendedor'
  final String pin;

  AppUser({
    required this.id,
    required this.name,
    required this.role,
    required this.pin,
  });

  bool get isAdmin => role == 'Administrador';

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'pin': pin,
    };
  }

  factory AppUser.fromMap(Map<String, dynamic> map) {
    return AppUser(
      id: map['id'],
      name: map['name'],
      role: map['role'],
      pin: map['pin'],
    );
  }
}
