import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/widgets/currency_field.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('CurrencyField shows currency prefix from field metadata', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    final field = FormFieldMetadata.fromMap({
      'name': 'unit_price',
      'label': 'Unit Price',
      'field_type': 'currency',
      'currency_code': 'EUR',
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CurrencyField(field: field, label: 'Unit Price', controller: controller),
        ),
      ),
    );

    expect(find.textContaining('EUR'), findsOneWidget);
    await tester.enterText(find.byType(TextField), '12.50');
    expect(controller.text, '12.50');
  });

  testWidgets('TextareaField renders multiline input', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: TextareaField(label: 'Notes', controller: controller, minLines: 3),
        ),
      ),
    );

    expect(find.byType(TextField), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'Line one');
    expect(controller.text, 'Line one');
  });
}
