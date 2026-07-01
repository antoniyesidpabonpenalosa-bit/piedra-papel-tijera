import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../models/app_user.dart';
import '../models/cash_register.dart';
import '../models/expense.dart';
import '../models/business_config.dart';

class DatabaseService {
  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final path = join(await getDatabasesPath(), 'cuentas_claras.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _createTables,
    );
  }

  Future<void> _createTables(Database db, int version) async {
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        pin TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        salePrice REAL NOT NULL,
        cost REAL NOT NULL,
        stock INTEGER NOT NULL,
        minAlert INTEGER DEFAULT 5,
        barcode TEXT,
        category TEXT,
        imagePath TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE sales (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL,
        totalProfit REAL NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        clientId TEXT,
        clientName TEXT,
        sellerId TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (saleId) REFERENCES sales(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        clientName TEXT NOT NULL,
        total REAL NOT NULL,
        paid REAL NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        saleId TEXT,
        FOREIGN KEY (clientId) REFERENCES clients(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE payments (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE cash_registers (
        id TEXT PRIMARY KEY,
        initialAmount REAL NOT NULL,
        openedAt TEXT NOT NULL,
        closedAt TEXT,
        openedBy TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE expenses (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE business_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        businessId TEXT NOT NULL DEFAULT '',
        deviceName TEXT NOT NULL DEFAULT '',
        masterCode TEXT NOT NULL DEFAULT ''
      )
    ''');

    await db.insert('users', {
      'id': 'admin',
      'name': 'Admin',
      'role': 'Administrador',
      'pin': '1234',
    });

    await db.insert('business_config', {
      'id': 1,
      'businessId': 'mi_negocio',
      'deviceName': 'celular_1',
      'masterCode': '0000',
    });
  }

  // === USERS ===
  Future<List<AppUser>> getUsers() async {
    final db = await database;
    final maps = await db.query('users');
    return maps.map((m) => AppUser.fromMap(m)).toList();
  }

  Future<AppUser?> authenticateByPin(String pin) async {
    final db = await database;
    final maps = await db.query('users', where: 'pin = ?', whereArgs: [pin]);
    if (maps.isEmpty) return null;
    return AppUser.fromMap(maps.first);
  }

  Future<void> insertUser(AppUser user) async {
    final db = await database;
    await db.insert('users', user.toMap());
  }

  Future<void> deleteUser(String id) async {
    final db = await database;
    await db.delete('users', where: 'id = ?', whereArgs: [id]);
  }

  // === PRODUCTS ===
  Future<List<Product>> getProducts() async {
    final db = await database;
    final maps = await db.query('products', orderBy: 'name ASC');
    return maps.map((m) => Product.fromMap(m)).toList();
  }

  Future<List<String>> getCategories() async {
    final db = await database;
    final maps = await db.rawQuery(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""',
    );
    return maps.map((m) => m['category'] as String).toList();
  }

  Future<void> insertProduct(Product product) async {
    final db = await database;
    await db.insert('products', product.toMap());
  }

  Future<void> updateProduct(Product product) async {
    final db = await database;
    await db.update('products', product.toMap(),
        where: 'id = ?', whereArgs: [product.id]);
  }

  Future<void> deleteProduct(String id) async {
    final db = await database;
    await db.delete('products', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> updateStock(String productId, int newStock) async {
    final db = await database;
    await db.update('products', {'stock': newStock},
        where: 'id = ?', whereArgs: [productId]);
  }

  Future<Product?> getProductByBarcode(String barcode) async {
    final db = await database;
    final maps = await db.query('products',
        where: 'barcode = ?', whereArgs: [barcode]);
    if (maps.isEmpty) return null;
    return Product.fromMap(maps.first);
  }

  // === SALES ===
  Future<void> insertSale(Sale sale) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.insert('sales', sale.toMap());
      for (final item in sale.items) {
        await txn.insert('sale_items', {
          ...item.toMap(),
          'saleId': sale.id,
        });
      }
      for (final item in sale.items) {
        await txn.rawUpdate(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId],
        );
      }
    });
  }

  Future<List<Sale>> getSales({DateTime? from, DateTime? to}) async {
    final db = await database;
    String? where;
    List<dynamic>? whereArgs;

    if (from != null && to != null) {
      where = 'date >= ? AND date <= ?';
      whereArgs = [from.toIso8601String(), to.toIso8601String()];
    }

    final saleMaps = await db.query('sales',
        where: where, whereArgs: whereArgs, orderBy: 'date DESC');

    List<Sale> sales = [];
    for (final saleMap in saleMaps) {
      final itemMaps = await db.query('sale_items',
          where: 'saleId = ?', whereArgs: [saleMap['id']]);
      final items = itemMaps.map((m) => SaleItem.fromMap(m)).toList();
      sales.add(Sale.fromMap(saleMap, items));
    }
    return sales;
  }

  Future<Map<String, double>> getSalesTodaySummary() async {
    final db = await database;
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);
    final end = start.add(const Duration(days: 1));

    final result = await db.rawQuery(
      'SELECT COALESCE(SUM(total), 0) as totalSales, COALESCE(SUM(totalProfit), 0) as totalProfit FROM sales WHERE date >= ? AND date < ?',
      [start.toIso8601String(), end.toIso8601String()],
    );

    return {
      'sales': (result.first['totalSales'] as num).toDouble(),
      'profit': (result.first['totalProfit'] as num).toDouble(),
    };
  }

  Future<List<Map<String, dynamic>>> getSalesLast7Days() async {
    final db = await database;
    final now = DateTime.now();
    List<Map<String, dynamic>> dailySales = [];

    for (int i = 6; i >= 0; i--) {
      final day = DateTime(now.year, now.month, now.day - i);
      final nextDay = day.add(const Duration(days: 1));
      final result = await db.rawQuery(
        'SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date >= ? AND date < ?',
        [day.toIso8601String(), nextDay.toIso8601String()],
      );
      dailySales.add({
        'date': day,
        'total': (result.first['total'] as num).toDouble(),
      });
    }
    return dailySales;
  }

  Future<String?> getMostSoldProduct() async {
    final db = await database;
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);
    final end = start.add(const Duration(days: 1));

    final result = await db.rawQuery('''
      SELECT si.productName, SUM(si.quantity) as totalQty
      FROM sale_items si
      JOIN sales s ON si.saleId = s.id
      WHERE s.date >= ? AND s.date < ?
      GROUP BY si.productId
      ORDER BY totalQty DESC
      LIMIT 1
    ''', [start.toIso8601String(), end.toIso8601String()]);

    if (result.isEmpty) return null;
    return result.first['productName'] as String;
  }

  // === CLIENTS ===
  Future<List<Client>> getClients() async {
    final db = await database;
    final maps = await db.query('clients', orderBy: 'name ASC');
    return maps.map((m) => Client.fromMap(m)).toList();
  }

  Future<void> insertClient(Client client) async {
    final db = await database;
    await db.insert('clients', client.toMap());
  }

  Future<void> updateClient(Client client) async {
    final db = await database;
    await db.update('clients', client.toMap(),
        where: 'id = ?', whereArgs: [client.id]);
  }

  Future<void> deleteClient(String id) async {
    final db = await database;
    await db.delete('clients', where: 'id = ?', whereArgs: [id]);
  }

  // === ACCOUNTS (FIADOS) ===
  Future<List<Account>> getAccounts({bool pendingOnly = false}) async {
    final db = await database;
    String? where;
    if (pendingOnly) where = 'paid < total';
    final maps = await db.query('accounts', where: where, orderBy: 'date DESC');
    return maps.map((m) => Account.fromMap(m)).toList();
  }

  Future<void> insertAccount(Account account) async {
    final db = await database;
    await db.insert('accounts', account.toMap());
  }

  Future<void> addPayment(Payment payment) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.insert('payments', payment.toMap());
      await txn.rawUpdate(
        'UPDATE accounts SET paid = paid + ? WHERE id = ?',
        [payment.amount, payment.accountId],
      );
    });
  }

  Future<List<Payment>> getPayments(String accountId) async {
    final db = await database;
    final maps = await db.query('payments',
        where: 'accountId = ?', whereArgs: [accountId], orderBy: 'date DESC');
    return maps.map((m) => Payment.fromMap(m)).toList();
  }

  Future<void> deleteAccount(String id) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('payments', where: 'accountId = ?', whereArgs: [id]);
      await txn.delete('accounts', where: 'id = ?', whereArgs: [id]);
    });
  }

  Future<double> getTotalPendingAccounts() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COALESCE(SUM(total - paid), 0) as pending FROM accounts WHERE paid < total',
    );
    return (result.first['pending'] as num).toDouble();
  }

  Future<double> getTodayPayments() async {
    final db = await database;
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);
    final end = start.add(const Duration(days: 1));
    final result = await db.rawQuery(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date >= ? AND date < ?',
      [start.toIso8601String(), end.toIso8601String()],
    );
    return (result.first['total'] as num).toDouble();
  }

  // === CASH REGISTER ===
  Future<CashRegister?> getOpenCashRegister() async {
    final db = await database;
    final maps = await db.query('cash_registers',
        where: 'closedAt IS NULL', limit: 1);
    if (maps.isEmpty) return null;
    return CashRegister.fromMap(maps.first);
  }

  Future<void> openCashRegister(CashRegister register) async {
    final db = await database;
    await db.insert('cash_registers', register.toMap());
  }

  Future<void> closeCashRegister(String id) async {
    final db = await database;
    await db.update(
      'cash_registers',
      {'closedAt': DateTime.now().toIso8601String()},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // === EXPENSES ===
  Future<List<Expense>> getExpenses({DateTime? date}) async {
    final db = await database;
    if (date != null) {
      final start = DateTime(date.year, date.month, date.day);
      final end = start.add(const Duration(days: 1));
      final maps = await db.query('expenses',
          where: 'date >= ? AND date < ?',
          whereArgs: [start.toIso8601String(), end.toIso8601String()],
          orderBy: 'date DESC');
      return maps.map((m) => Expense.fromMap(m)).toList();
    }
    final maps = await db.query('expenses', orderBy: 'date DESC');
    return maps.map((m) => Expense.fromMap(m)).toList();
  }

  Future<void> insertExpense(Expense expense) async {
    final db = await database;
    await db.insert('expenses', expense.toMap());
  }

  Future<void> deleteExpense(String id) async {
    final db = await database;
    await db.delete('expenses', where: 'id = ?', whereArgs: [id]);
  }

  Future<double> getTodayExpenses() async {
    final db = await database;
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);
    final end = start.add(const Duration(days: 1));
    final result = await db.rawQuery(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date < ?',
      [start.toIso8601String(), end.toIso8601String()],
    );
    return (result.first['total'] as num).toDouble();
  }

  // === BUSINESS CONFIG ===
  Future<BusinessConfig> getBusinessConfig() async {
    final db = await database;
    final maps = await db.query('business_config', where: 'id = 1');
    if (maps.isEmpty) {
      return BusinessConfig(businessId: '', deviceName: '', masterCode: '');
    }
    return BusinessConfig.fromMap(maps.first);
  }

  Future<void> updateBusinessConfig(BusinessConfig config) async {
    final db = await database;
    await db.update('business_config', config.toMap(), where: 'id = 1');
  }

  // === RESET ===
  Future<void> resetDatabase() async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('sale_items');
      await txn.delete('sales');
      await txn.delete('payments');
      await txn.delete('accounts');
      await txn.delete('products');
      await txn.delete('clients');
      await txn.delete('expenses');
      await txn.delete('cash_registers');
      await txn.delete('users', where: 'id != ?', whereArgs: ['admin']);
    });
  }
}
