import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/format_helpers.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _filterType = 'Todos';
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().loadSales();
    });
  }

  Future<void> _selectDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primary,
              surface: AppTheme.surface,
            ),
          ),
          child: child!,
        );
      },
    );
    if (range != null) {
      setState(() => _dateRange = range);
      if (mounted) {
        context.read<AppState>().loadSales(
              from: range.start,
              to: range.end.add(const Duration(days: 1)),
            );
      }
    }
  }

  void _clearDateFilter() {
    setState(() => _dateRange = null);
    context.read<AppState>().loadSales();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    var sales = appState.sales;

    if (_filterType != 'Todos') {
      sales = sales.where((s) => s.type == _filterType).toList();
    }

    final totalSales = sales.fold<double>(0, (sum, s) => sum + s.total);
    final totalProfit = sales.fold<double>(0, (sum, s) => sum + s.totalProfit);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: _selectDateRange,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.divider),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today,
                            size: 18, color: AppTheme.primary),
                        const SizedBox(width: 8),
                        Text(
                          _dateRange != null
                              ? '${formatDateShort(_dateRange!.start)} - ${formatDateShort(_dateRange!.end)}'
                              : 'Todas las fechas',
                          style: const TextStyle(fontSize: 14),
                        ),
                        if (_dateRange != null) ...[
                          const Spacer(),
                          GestureDetector(
                            onTap: _clearDateFilter,
                            child: const Icon(Icons.close, size: 18),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.divider),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _filterType,
                    dropdownColor: AppTheme.cardColor,
                    items: ['Todos', 'Directo', 'A cuenta']
                        .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (v) => setState(() => _filterType = v!),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${sales.length} ventas',
                  style: const TextStyle(color: AppTheme.textSecondary)),
              Text('Total: ${formatCurrency(totalSales)}',
                  style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
              Text('Gan: ${formatCurrency(totalProfit)}',
                  style: const TextStyle(color: AppTheme.green, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: sales.isEmpty
              ? const Center(child: Text('No hay ventas'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: sales.length,
                  itemBuilder: (_, i) {
                    final sale = sales[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.teal.withOpacity(0.2),
                          child: const Icon(Icons.point_of_sale,
                              color: AppTheme.teal),
                        ),
                        title: Text(
                          sale.type == 'A cuenta'
                              ? sale.clientName ?? 'A cuenta'
                              : 'Directo',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          formatDate(sale.date),
                          style: const TextStyle(
                              color: AppTheme.textSecondary, fontSize: 12),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              formatCurrency(sale.total),
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              'Gan: ${formatCurrency(sale.totalProfit)}',
                              style: const TextStyle(
                                  color: AppTheme.green, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
