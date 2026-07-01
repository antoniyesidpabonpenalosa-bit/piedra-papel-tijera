import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/business_config.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  void _showAddUserDialog(BuildContext context) {
    final nameController = TextEditingController();
    final pinController = TextEditingController();
    String selectedRole = 'Vendedor';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Nuevo Usuario'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Nombre'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: pinController,
                decoration: const InputDecoration(labelText: 'PIN (4 digitos)'),
                keyboardType: TextInputType.number,
                maxLength: 4,
                obscureText: true,
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: selectedRole,
                decoration: const InputDecoration(labelText: 'Rol'),
                dropdownColor: AppTheme.cardColor,
                items: ['Administrador', 'Cajero', 'Vendedor']
                    .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                    .toList(),
                onChanged: (v) => setDialogState(() => selectedRole = v!),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                if (nameController.text.isNotEmpty &&
                    pinController.text.length == 4) {
                  context.read<AppState>().addUser(
                        nameController.text,
                        selectedRole,
                        pinController.text,
                      );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Agregar'),
            ),
          ],
        ),
      ),
    );
  }

  void _showBusinessConfigDialog(BuildContext context) {
    final appState = context.read<AppState>();
    final config = appState.businessConfig;
    final businessIdController =
        TextEditingController(text: config?.businessId ?? '');
    final deviceNameController =
        TextEditingController(text: config?.deviceName ?? '');
    final masterCodeController =
        TextEditingController(text: config?.masterCode ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.store, color: AppTheme.primary),
            const SizedBox(width: 8),
            const Text('Identidad del Negocio'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Define estos datos para que tus ventas se sincronicen correctamente en la nube.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: businessIdController,
              decoration: const InputDecoration(
                labelText: 'ID del Negocio',
                prefixIcon: Icon(Icons.home, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: deviceNameController,
              decoration: const InputDecoration(
                labelText: 'Nombre de este Celular',
                prefixIcon: Icon(Icons.phone_android, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: masterCodeController,
              decoration: const InputDecoration(
                labelText: 'Codigo Maestro (Recuperacion)',
                prefixIcon: Icon(Icons.vpn_key, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton.icon(
                onPressed: () {
                  showDialog(
                    context: ctx,
                    builder: (confirmCtx) => AlertDialog(
                      title: const Text('Reiniciar Sistema'),
                      content: const Text(
                          'Se eliminaran todos los datos. Esta accion no se puede deshacer.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(confirmCtx),
                          child: const Text('Cancelar'),
                        ),
                        ElevatedButton(
                          onPressed: () async {
                            await appState.resetSystem();
                            if (confirmCtx.mounted) Navigator.pop(confirmCtx);
                            if (ctx.mounted) Navigator.pop(ctx);
                          },
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.red),
                          child: const Text('Reiniciar'),
                        ),
                      ],
                    ),
                  );
                },
                icon: const Icon(Icons.restart_alt, color: AppTheme.red),
                label: const Text('REINICIAR SISTEMA',
                    style: TextStyle(color: AppTheme.red)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              appState.updateBusinessConfig(BusinessConfig(
                businessId: businessIdController.text,
                deviceName: deviceNameController.text,
                masterCode: masterCodeController.text,
              ));
              Navigator.pop(ctx);
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final users = appState.users;
    final currentUser = appState.currentUser;

    return Scaffold(
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: users.length + 1,
        itemBuilder: (_, i) {
          if (i == users.length) {
            return Padding(
              padding: const EdgeInsets.only(top: 24),
              child: OutlinedButton.icon(
                onPressed: () => _showBusinessConfigDialog(context),
                icon: const Icon(Icons.settings),
                label: const Text('Configuracion del Negocio'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.divider),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            );
          }

          final user = users[i];
          final isCurrentUser = user.id == currentUser?.id;

          Color avatarColor;
          IconData avatarIcon;
          switch (user.role) {
            case 'Administrador':
              avatarColor = AppTheme.primary;
              avatarIcon = Icons.star;
              break;
            case 'Cajero':
              avatarColor = AppTheme.green;
              avatarIcon = Icons.point_of_sale;
              break;
            default:
              avatarColor = AppTheme.teal;
              avatarIcon = Icons.person;
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: avatarColor,
                child: Icon(avatarIcon, color: Colors.white),
              ),
              title: Text(user.name,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Rol: ${user.role}',
                  style: const TextStyle(color: AppTheme.textSecondary)),
              trailing: isCurrentUser
                  ? Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.textSecondary),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Tu',
                          style: TextStyle(color: AppTheme.textSecondary)),
                    )
                  : IconButton(
                      icon: const Icon(Icons.delete, color: AppTheme.red),
                      onPressed: () =>
                          context.read<AppState>().deleteUser(user.id),
                    ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddUserDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }
}
