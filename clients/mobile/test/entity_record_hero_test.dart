import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/utils/record_headline.dart';
import 'package:emcap_mobile/widgets/emcap_badge.dart';

/// M2 PRODUCT detail hero contract (P15-T13 / P20-T03) — mirrors
/// `entity_record_screen.dart` headline row without API wiring.
void main() {
  const statusField = StatusFieldMetadata(
    field: 'active',
    activeValues: [true],
    labels: {
      'active': {'en': 'Active'},
      'inactive': {'en': 'Inactive'},
    },
  );

  Widget heroRow(RecordHeadlineView view) {
    return MaterialApp(
      theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
      home: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(view.headline, key: const Key('hero-headline')),
                    if (view.subtitle.isNotEmpty)
                      Text(view.subtitle, key: const Key('hero-subtitle')),
                  ],
                ),
              ),
              if (view.statusLabel.isNotEmpty)
                EmcapStatusChip(label: view.statusLabel, active: view.statusActive),
            ],
          ),
        ),
      ),
    );
  }

  testWidgets('PRODUCT hero shows SKU — Name em dash headline', (tester) async {
    final view = buildRecordHeadlineView(
      'PRODUCT',
      {
        'sku': 'SKU-DEMO-001',
        'name': 'Demo Widget',
        'quantity_on_hand': 42,
        'unit_price': 19.99,
        'active': true,
      },
      false,
      'prod-1',
      (key) => key,
      statusField: statusField,
    );
    await tester.pumpWidget(heroRow(view));

    expect(find.byKey(const Key('hero-headline')), findsOneWidget);
    expect(find.text('SKU-DEMO-001 — Demo Widget'), findsOneWidget);
    expect(find.textContaining('entity.stockLine'), findsOneWidget);
    expect(find.text('ACTIVE'), findsOneWidget);
    expect(find.byType(EmcapStatusChip), findsOneWidget);
  });

  testWidgets('PRODUCT hero inactive chip uses off variant', (tester) async {
    final view = buildRecordHeadlineView(
      'PRODUCT',
      {'sku': 'SKU-X', 'name': 'Item', 'active': false},
      false,
      'prod-2',
      (key) => key,
      statusField: statusField,
    );
    await tester.pumpWidget(heroRow(view));
    expect(find.text('INACTIVE'), findsOneWidget);
  });

  testWidgets('new PRODUCT record shows create headline', (tester) async {
    final view = buildRecordHeadlineView('PRODUCT', {}, true, null, (key) => key);
    await tester.pumpWidget(heroRow(view));
    expect(find.text('entity.newRecord'), findsOneWidget);
    expect(find.byType(EmcapStatusChip), findsNothing);
  });
}
