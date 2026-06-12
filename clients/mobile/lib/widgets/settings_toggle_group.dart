import 'package:flutter/material.dart';

class SettingsToggleItem {
  SettingsToggleItem({required this.key, required this.label, required this.checked});

  final String key;
  final String label;
  bool checked;
}

class SettingsToggleGroup extends StatelessWidget {
  const SettingsToggleGroup({
    super.key,
    required this.title,
    required this.items,
    required this.onChanged,
  });

  final String title;
  final List<SettingsToggleItem> items;
  final void Function(String key, bool checked) onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        title: Text(title),
        children: items
            .map(
              (item) => SwitchListTile(
                title: Text(item.label),
                value: item.checked,
                onChanged: (value) => onChanged(item.key, value),
              ),
            )
            .toList(),
      ),
    );
  }
}
