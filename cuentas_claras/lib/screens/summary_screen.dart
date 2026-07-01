import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:csv/csv.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/format_helpers.dart';

class SummaryScreen extends StatefulWidget {
  const SummaryScreen({super.key});

  @override
  State<SummaryScreen> createState() => _SummaryScreenState();
}

class _SummaryScreenState extends State<SummaryScreen> {
  Map<String, dynamic>? _dashboardData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final data = await context.read<AppState>().getDashboardData();
    if (mounted) {
      setState(() {
        _dashboardData = data;
        _loading = false;
      });
    }
  }

  Future<void> _exportCsv(bool isSales) async {
    final appState = context.read<AppState>();
    final rows = isSales
        ? await appState.exportSalesCsv()
        : await appState.exportExpensesCsv();

    final csv = const ListToCsvConverter().convert(rows);
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/${isSales ? 'ventas' : 'gastos'}.csv');
    await file.writeAsString(csv);

    await Share.shareXFiles(
      [XFile(file.path)],
      subject: isSales ? 'Ventas CSV' : 'Gastos CSV',
    );
  }

  void _showExpensesDialog() {
    final descController = TextEditingController();
    final amountController = TextEditingController();
    final appState = context.read<AppState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            title: const Text('Gastos del Dia'),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: descController,
                          decoration: const InputDecoration(labelText: 'Descripcion'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 100,
                        child: TextField(
                          controller: amountController,
                          decoration: const InputDecoration(labelText: 'Monto'),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add, color: AppTheme.primary),
                        onPressed: () async {
                          if (descController.text.isNotEmpty &&
                              amountController.text.isNotEmpty) {
                            await appState.addExpense(
                              descController.text,
                              double.parse(amountController.text),
                            );
                            descController.clear();
                            amountController.clear();
                            setDialogState(() {});
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...appState.todayExpenses.map((e) => ListTile(
                        title: Text(e.description),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(formatCurrency(e.amount),
                                style: const TextStyle(color: AppTheme.red)),
                            IconButton(
                              icon: const Icon(Icons.delete,
                                  color: AppTheme.red, size: 18),
                              onPressed: () async {
                                await appState.deleteExpense(e.id);
                                setDialogState(() {});
                              },
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _loadData();
                },
                child: const Text('Cerrar'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final data = _dashboardData!;
    final appState = context.watch<AppState>();
    final cashRegister = appState.cashRegister;
    final last7Days = data['last7Days'] as List<Map<String, dynamic>>;
    final dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('DASHBOARD',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud_done, color: AppTheme.green, size: 14),
                    SizedBox(width: 4),
                    Text('Nube Activa',
                        style: TextStyle(color: AppTheme.green, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('RESUMEN LOCAL',
              style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildSummaryCard(
                'Ventas + Abonos',
                formatCurrency(data['salesTotal'] + data['payments']),
                Icons.point_of_sale,
                AppTheme.primary,
              ),
              const SizedBox(width: 12),
              _buildSummaryCard(
                'Solo Abonos',
                formatCurrency(data['payments']),
                Icons.payment,
                AppTheme.green,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildSummaryCard(
                'Gastos Hoy',
                formatCurrency(data['expenses']),
                Icons.trending_down,
                AppTheme.red,
              ),
              const SizedBox(width: 12),
              _buildSummaryCard(
                'Mermas (Perdida)',
                formatCurrency(0),
                Icons.receipt,
                AppTheme.primary,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_wallet,
                      color: AppTheme.teal),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Ganancia Neta (Caja)',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      Text(
                        formatCurrency(data['netProfit']),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.star, color: Colors.purple.shade300),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Mas vendido',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      Text(data['mostSold'] ?? '—',
                          style: const TextStyle(fontSize: 16)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('ULTIMOS 7 DIAS',
              style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 150,
                child: BarChart(
                  BarChartData(
                    alignment: BarChartAlignment.spaceAround,
                    barGroups: last7Days.asMap().entries.map((entry) {
                      return BarChartGroupData(
                        x: entry.key,
                        barRods: [
                          BarChartRodData(
                            toY: entry.value['total'],
                            color: AppTheme.primary,
                            width: 16,
                            borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(4)),
                          ),
                        ],
                      );
                    }).toList(),
                    titlesData: FlTitlesData(
                      leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, _) {
                            final date =
                                last7Days[value.toInt()]['date'] as DateTime;
                            return Text(
                              dayNames[date.weekday - 1],
                              style: const TextStyle(
                                  color: AppTheme.textSecondary, fontSize: 12),
                            );
                          },
                        ),
                      ),
                    ),
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (cashRegister != null) ...[
            const Text('CAJA',
                style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lock_open, color: AppTheme.teal, size: 18),
                        const SizedBox(width: 8),
                        Text('Caja abierta por: ${cashRegister.openedBy}'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Monto inicial:'),
                        Text(formatCurrency(cashRegister.initialAmount)),
                      ],
                    ),
                    Center(
                      child: Text(
                        'Desde: ${formatDate(cashRegister.openedAt)}',
                        style: const TextStyle(
                            color: AppTheme.textSecondary, fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await appState.closeCashRegister();
                          _loadData();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.red,
                        ),
                        icon: const Icon(Icons.lock, size: 18),
                        label: const Text('CERRAR CAJA'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Text('GASTOS',
              style: TextStyle(
                  color: AppTheme.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showExpensesDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.red.withOpacity(0.8),
              ),
              icon: const Icon(Icons.shopping_cart),
              label: const Text('GESTIONAR GASTOS DEL DIA'),
            ),
          ),
          const SizedBox(height: 16),
          const Text('EXPORTAR',
              style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _exportCsv(true),
                  icon: const Icon(Icons.download),
                  label: const Text('Ventas CSV'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.divider),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _exportCsv(false),
                  icon: const Icon(Icons.save),
                  label: const Text('Gastos CSV'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.divider),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
      String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: color, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(title,
                        style: const TextStyle(
                            color: AppTheme.textSecondary, fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
