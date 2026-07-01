import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/format_helpers.dart';

class AccountsScreen extends StatelessWidget {
  const AccountsScreen({super.key});

  void _showPaymentDialog(BuildContext context, String accountId, double pending) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Abonar'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Monto a abonar',
            hintText: 'Pendiente: ${formatCurrency(pending)}',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount = double.tryParse(controller.text);
              if (amount != null && amount > 0) {
                context.read<AppState>().addPaymentToAccount(accountId, amount);
                Navigator.pop(ctx);
              }
            },
            child: const Text('Abonar'),
          ),
        ],
      ),
    );
  }

  void _showPaymentHistory(BuildContext context, String accountId, String clientName) async {
    final payments = await context.read<AppState>().getPaymentHistory(accountId);
    if (!context.mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Historial - $clientName'),
        content: SizedBox(
          width: double.maxFinite,
          child: payments.isEmpty
              ? const Text('No hay abonos registrados')
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: payments.length,
                  itemBuilder: (_, i) {
                    final p = payments[i];
                    return ListTile(
                      leading: const Icon(Icons.payment, color: AppTheme.green),
                      title: Text(formatCurrency(p.amount)),
                      subtitle: Text(formatDate(p.date)),
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final accounts = appState.accounts;

    if (accounts.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: AppTheme.textSecondary),
            SizedBox(height: 16),
            Text('No hay cuentas pendientes'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: accounts.length,
      itemBuilder: (_, i) {
        final account = accounts[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      account.clientName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.history, color: AppTheme.textSecondary),
                      onPressed: () => _showPaymentHistory(
                          context, account.id, account.clientName),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total: ${formatCurrency(account.total)}'),
                    Text(
                      'Abonado: ${formatCurrency(account.paid)}',
                      style: const TextStyle(color: AppTheme.teal),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'PENDIENTE: ${formatCurrency(account.pending)}',
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  'Desde ${formatDate(account.date)}',
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const Divider(color: AppTheme.divider),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    TextButton.icon(
                      onPressed: () => _showPaymentDialog(
                          context, account.id, account.pending),
                      icon: const Icon(Icons.payment, color: AppTheme.teal, size: 18),
                      label: const Text('ABONAR',
                          style: TextStyle(color: AppTheme.teal)),
                    ),
                    TextButton.icon(
                      onPressed: () =>
                          context.read<AppState>().payFullAccount(account.id),
                      icon: const Icon(Icons.point_of_sale,
                          color: AppTheme.primary, size: 18),
                      label: const Text('COBRAR SALDO',
                          style: TextStyle(color: AppTheme.primary)),
                    ),
                    IconButton(
                      onPressed: () =>
                          context.read<AppState>().deleteAccount(account.id),
                      icon: const Icon(Icons.delete, color: AppTheme.red, size: 20),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
