import 'package:intl/intl.dart';

String formatCurrency(double amount) {
  final format = NumberFormat('#,###', 'es');
  return '\$${format.format(amount.round())}';
}

String formatDate(DateTime date) {
  return DateFormat('dd/MM/yyyy HH:mm').format(date);
}

String formatDateShort(DateTime date) {
  return DateFormat('dd/MM/yyyy').format(date);
}
