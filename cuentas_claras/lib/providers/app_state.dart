import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../models/app_user.dart';
import '../models/cash_register.dart';
import '../models/expense.dart';
import '../models/business_config.dart';
import '../services/database_service.dart';
import 'package:uuid/uuid.dart';

class AppState extends ChangeNotifier {
  final DatabaseService _db = DatabaseService();
  final Uuid _uuid = const Uuid();

  AppUser? currentUser;
  List<Product> products = [];
  List<String> categories = [];
  List<Sale> sales = [];
  List<Client> clients = [];
  List<Account> accounts = [];
  List<AppUser> users = [];
  List<Expense> todayExpenses = [];
  CashRegister? cashRegister;
  BusinessConfig? businessConfig;
  Map<String, int> cart = {};

  Future<void> init() async {
    await loadProducts();
    await loadClients();
    await loadAccounts();
    await loadUsers();
    await loadCashRegister();
    await loadBusinessConfig();
    await loadTodayExpenses();
  }

  // === AUTH ===
  Future<bool> login(String pin) async {
    final user = await _db.authenticateByPin(pin);
    if (user != null) {
      currentUser = user;
      await init();
      notifyListeners();
      return true;
    }
    return false;
  }

  void logout() {
    currentUser = null;
    cart.clear();
    notifyListeners();
  }

  // === PRODUCTS ===
  Future<void> loadProducts() async {
    products = await _db.getProducts();
    categories = await _db.getCategories();
    notifyListeners();
  }

  Future<void> addProduct({
    required String name,
    required double salePrice,
    required double cost,
    required int stock,
    int minAlert = 5,
    String? barcode,
    String? category,
    String? imagePath,
  }) async {
    final product = Product(
      id: _uuid.v4(),
      name: name,
      salePrice: salePrice,
      cost: cost,
      stock: stock,
      minAlert: minAlert,
      barcode: barcode,
      category: category,
      imagePath: imagePath,
    );
    await _db.insertProduct(product);
    await loadProducts();
  }

  Future<void> updateProduct(Product product) async {
    await _db.updateProduct(product);
    await loadProducts();
  }

  Future<void> deleteProduct(String id) async {
    await _db.deleteProduct(id);
    await loadProducts();
  }

  Future<Product?> scanBarcode(String barcode) async {
    return await _db.getProductByBarcode(barcode);
  }

  // === CART ===
  void addToCart(String productId) {
    cart[productId] = (cart[productId] ?? 0) + 1;
    notifyListeners();
  }

  void removeFromCart(String productId) {
    if (cart.containsKey(productId)) {
      if (cart[productId]! > 1) {
        cart[productId] = cart[productId]! - 1;
      } else {
        cart.remove(productId);
      }
      notifyListeners();
    }
  }

  void clearCart() {
    cart.clear();
    notifyListeners();
  }

  double get cartTotal {
    double total = 0;
    cart.forEach((productId, qty) {
      final product = products.firstWhere((p) => p.id == productId);
      total += product.salePrice * qty;
    });
    return total;
  }

  double get cartProfit {
    double profit = 0;
    cart.forEach((productId, qty) {
      final product = products.firstWhere((p) => p.id == productId);
      profit += product.profit * qty;
    });
    return profit;
  }

  List<SaleItem> get cartItems {
    return cart.entries.map((entry) {
      final product = products.firstWhere((p) => p.id == entry.key);
      return SaleItem(
        productId: product.id,
        productName: product.name,
        price: product.salePrice,
        cost: product.cost,
        quantity: entry.value,
      );
    }).toList();
  }

  // === SALES ===
  Future<void> completeSale({String type = 'Directo', String? clientId, String? clientName}) async {
    if (cart.isEmpty) return;

    final sale = Sale(
      id: _uuid.v4(),
      items: cartItems,
      total: cartTotal,
      totalProfit: cartProfit,
      date: DateTime.now(),
      type: type,
      clientId: clientId,
      clientName: clientName,
      sellerId: currentUser?.id ?? 'unknown',
    );

    await _db.insertSale(sale);

    if (type == 'A cuenta' && clientId != null && clientName != null) {
      final account = Account(
        id: _uuid.v4(),
        clientId: clientId,
        clientName: clientName,
        total: cartTotal,
        paid: 0,
        date: DateTime.now(),
        saleId: sale.id,
      );
      await _db.insertAccount(account);
      await loadAccounts();
    }

    cart.clear();
    await loadProducts();
    await loadSales();
  }

  Future<void> loadSales({DateTime? from, DateTime? to}) async {
    sales = await _db.getSales(from: from, to: to);
    notifyListeners();
  }

  // === CLIENTS ===
  Future<void> loadClients() async {
    clients = await _db.getClients();
    notifyListeners();
  }

  Future<void> addClient(String name, {String? phone}) async {
    final client = Client(id: _uuid.v4(), name: name, phone: phone);
    await _db.insertClient(client);
    await loadClients();
  }

  Future<void> deleteClient(String id) async {
    await _db.deleteClient(id);
    await loadClients();
  }

  // === ACCOUNTS ===
  Future<void> loadAccounts() async {
    accounts = await _db.getAccounts(pendingOnly: true);
    notifyListeners();
  }

  Future<void> addPaymentToAccount(String accountId, double amount) async {
    final payment = Payment(
      id: _uuid.v4(),
      accountId: accountId,
      amount: amount,
      date: DateTime.now(),
    );
    await _db.addPayment(payment);
    await loadAccounts();
  }

  Future<void> payFullAccount(String accountId) async {
    final account = accounts.firstWhere((a) => a.id == accountId);
    await addPaymentToAccount(accountId, account.pending);
  }

  Future<void> deleteAccount(String id) async {
    await _db.deleteAccount(id);
    await loadAccounts();
  }

  Future<List<Payment>> getPaymentHistory(String accountId) async {
    return await _db.getPayments(accountId);
  }

  // === USERS ===
  Future<void> loadUsers() async {
    users = await _db.getUsers();
    notifyListeners();
  }

  Future<void> addUser(String name, String role, String pin) async {
    final user = AppUser(id: _uuid.v4(), name: name, role: role, pin: pin);
    await _db.insertUser(user);
    await loadUsers();
  }

  Future<void> deleteUser(String id) async {
    await _db.deleteUser(id);
    await loadUsers();
  }

  // === CASH REGISTER ===
  Future<void> loadCashRegister() async {
    cashRegister = await _db.getOpenCashRegister();
    notifyListeners();
  }

  Future<void> openCashRegister(double initialAmount) async {
    final register = CashRegister(
      id: _uuid.v4(),
      initialAmount: initialAmount,
      openedAt: DateTime.now(),
      openedBy: currentUser?.name ?? 'Admin',
    );
    await _db.openCashRegister(register);
    await loadCashRegister();
  }

  Future<void> closeCashRegister() async {
    if (cashRegister != null) {
      await _db.closeCashRegister(cashRegister!.id);
      await loadCashRegister();
    }
  }

  // === EXPENSES ===
  Future<void> loadTodayExpenses() async {
    todayExpenses = await _db.getExpenses(date: DateTime.now());
    notifyListeners();
  }

  Future<void> addExpense(String description, double amount) async {
    final expense = Expense(
      id: _uuid.v4(),
      description: description,
      amount: amount,
      date: DateTime.now(),
    );
    await _db.insertExpense(expense);
    await loadTodayExpenses();
  }

  Future<void> deleteExpense(String id) async {
    await _db.deleteExpense(id);
    await loadTodayExpenses();
  }

  // === SUMMARY ===
  Future<Map<String, dynamic>> getDashboardData() async {
    final salesToday = await _db.getSalesTodaySummary();
    final todayPayments = await _db.getTodayPayments();
    final todayExpensesTotal = await _db.getTodayExpenses();
    final mostSold = await _db.getMostSoldProduct();
    final last7Days = await _db.getSalesLast7Days();

    return {
      'salesTotal': salesToday['sales'],
      'salesProfit': salesToday['profit'],
      'payments': todayPayments,
      'expenses': todayExpensesTotal,
      'netProfit': (salesToday['sales']! + todayPayments) - todayExpensesTotal,
      'mostSold': mostSold,
      'last7Days': last7Days,
    };
  }

  // === BUSINESS CONFIG ===
  Future<void> loadBusinessConfig() async {
    businessConfig = await _db.getBusinessConfig();
    notifyListeners();
  }

  Future<void> updateBusinessConfig(BusinessConfig config) async {
    await _db.updateBusinessConfig(config);
    await loadBusinessConfig();
  }

  // === RESET ===
  Future<void> resetSystem() async {
    await _db.resetDatabase();
    await init();
  }

  // === CSV EXPORT ===
  Future<List<List<dynamic>>> exportSalesCsv() async {
    final allSales = await _db.getSales();
    List<List<dynamic>> rows = [
      ['ID', 'Fecha', 'Tipo', 'Total', 'Ganancia', 'Cliente']
    ];
    for (final sale in allSales) {
      rows.add([
        sale.id,
        sale.date.toIso8601String(),
        sale.type,
        sale.total,
        sale.totalProfit,
        sale.clientName ?? 'Directo',
      ]);
    }
    return rows;
  }

  Future<List<List<dynamic>>> exportExpensesCsv() async {
    final allExpenses = await _db.getExpenses();
    List<List<dynamic>> rows = [
      ['ID', 'Fecha', 'Descripcion', 'Monto']
    ];
    for (final expense in allExpenses) {
      rows.add([
        expense.id,
        expense.date.toIso8601String(),
        expense.description,
        expense.amount,
      ]);
    }
    return rows;
  }
}
