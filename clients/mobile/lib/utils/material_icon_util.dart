import 'package:flutter/material.dart';

/// Maps Material icon ligature names from GET `/menus` to [IconData].
/// Unknown names fall back to [Icons.folder] (same as legacy shell behaviour).
IconData iconFromMaterialName(String? name) {
  if (name == null || name.isEmpty) {
    return Icons.folder;
  }
  return _materialIcons[name] ?? Icons.folder;
}

const Map<String, IconData> _materialIcons = {
  'account_balance': Icons.account_balance,
  'account_balance_wallet': Icons.account_balance_wallet,
  'assessment': Icons.assessment,
  'assignment': Icons.assignment,
  'badge': Icons.badge,
  'contacts': Icons.contacts,
  'devices': Icons.devices,
  'event_busy': Icons.event_busy,
  'groups': Icons.groups,
  'history': Icons.history,
  'inventory_2': Icons.inventory_2,
  'leaderboard': Icons.leaderboard,
  'local_shipping': Icons.local_shipping,
  'menu_book': Icons.menu_book,
  'pending_actions': Icons.pending_actions,
  'people': Icons.people,
  'person_search': Icons.person_search,
  'pie_chart': Icons.pie_chart,
  'point_of_sale': Icons.point_of_sale,
  'receipt_long': Icons.receipt_long,
  'request_quote': Icons.request_quote,
  'shopping_cart': Icons.shopping_cart,
  'swap_horiz': Icons.swap_horiz,
  'today': Icons.today,
  'warehouse': Icons.warehouse,
  'warning': Icons.warning,
};
