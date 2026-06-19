import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/widgets/permission_picker.dart';
import 'package:emcap_mobile/widgets/settings_toggle_group.dart';

import 'support/screen_test_harness.dart';

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  testWidgets('SettingsToggleGroup fires onChanged', (tester) async {
    final items = [SettingsToggleItem(key: 'workflow', label: 'Workflow', checked: true)];
    String? changedKey;
    bool? changedValue;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SettingsToggleGroup(
            title: 'Modules',
            items: items,
            onChanged: (key, checked) {
              changedKey = key;
              changedValue = checked;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.text('Modules'));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();

    expect(changedKey, 'workflow');
    expect(changedValue, isFalse);
  });

  testWidgets('PermissionPicker toggles wildcard and permission', (tester) async {
    var selected = <String>['customer.read'];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PermissionPicker(
            permissions: ['customer.read', 'customer.write', 'admin.users.read'],
            selected: selected,
            onChanged: (next) => selected = next,
          ),
        ),
      ),
    );

    await tester.tap(find.textContaining('Customer'));
    await tester.pumpAndSettle();

    await tester.tap(find.textContaining('customer.write'));
    await tester.pumpAndSettle();
    expect(selected, contains('customer.write'));

    await tester.tap(find.textContaining('All Customer'));
    await tester.pumpAndSettle();
    expect(selected, contains('customer.*'));
  });
}
