import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _PoClient extends EmcapClient {
  _PoClient(this._record);

  Map<String, dynamic> _record;
  Map<String, dynamic>? lastUpdate;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    if (entityCode == 'PURCHASE_ORDER_LINE') {
      return purchaseOrderLineFormMetadataJson();
    }
    return purchaseOrderFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      Map<String, dynamic>.from(_record);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    if (entityCode == 'PURCHASE_ORDER_LINE') {
      return [
        {
          'id': 'line-1',
          'po_id': 'po-1',
          'product_id': 'prod-1',
          'quantity': 5,
          'unit_price': 12.5,
        },
      ];
    }
    return [];
  }

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];

  @override
  Future<Map<String, dynamic>> updateRecord(
    String entityCode,
    String recordId,
    Map<String, dynamic> body, {
    int? ifMatch,
  }) async {
    lastUpdate = body;
    _record = {
      ..._record,
      ...body,
      'record_version': (_record['record_version'] as int? ?? 0) + 1,
    };
    return Map<String, dynamic>.from(_record);
  }

  @override
  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> body,
  ) async {
    return {'id': 'new-line', ...body};
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityRecordScreen shows PO lines receive and payment summary', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _PoClient({
            'id': 'po-1',
            'po_number': 'PO-001',
            'supplier_id': 'sup-1',
            'status': 'submitted',
            'total_amount': 100,
            'amount_paid': 0,
            'balance_due': 100,
            'record_version': 1,
          }),
          entityCode: 'PURCHASE_ORDER',
          title: 'Purchase orders',
          recordId: 'po-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('PO-001'), findsOneWidget);
    expect(find.text(EmcapLocale.t('procurement.po.lines')), findsOneWidget);
    expect(find.text(EmcapLocale.t('procurement.po.receive')), findsOneWidget);
    expect(find.text(EmcapLocale.t('entity.addLine')), findsOneWidget);
    expect(find.text(EmcapLocale.t('procurement.payment.record')), findsOneWidget);
    expect(find.text(EmcapLocale.t('procurement.payment.summary')), findsOneWidget);
    expect(find.textContaining('prod-1'), findsOneWidget);
  });

  testWidgets('EntityRecordScreen receive PO confirms and updates status', (tester) async {
    final client = _PoClient({
      'id': 'po-1',
      'po_number': 'PO-001',
      'status': 'draft',
      'record_version': 1,
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'PURCHASE_ORDER',
          title: 'Purchase orders',
          recordId: 'po-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('procurement.po.receive')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('procurement.po.receiveConfirm')), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('procurement.po.receive')).last);
    await settleEntityScreen(tester);

    expect(client.lastUpdate, {'status': 'received'});
  });

  testWidgets('EntityRecordScreen add line navigates with po_id prefill', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _PoClient({
            'id': 'po-1',
            'po_number': 'PO-001',
            'status': 'draft',
            'record_version': 1,
          }),
          entityCode: 'PURCHASE_ORDER',
          title: 'Purchase orders',
          recordId: 'po-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('entity.addLine')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.createRecord')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen child create applies po_id query param', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _PoClient({}),
          entityCode: 'PURCHASE_ORDER_LINE',
          title: 'PO line',
          creatingNew: true,
          queryParams: const {'po_id': 'po-prefill'},
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('po-prefill'), findsOneWidget);
  });

  testWidgets('EntityRecordScreen SO add line navigates with sales_order_id prefill', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _SoClient({
            'id': 'so-1',
            'order_number': 'SO-001',
            'status': 'draft',
            'record_version': 1,
          }),
          entityCode: 'SALES_ORDER',
          title: 'Sales orders',
          recordId: 'so-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('sales.so.lines')), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('entity.addLine')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.createRecord')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen child create applies sales_order_id query param', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _SoClient({}),
          entityCode: 'SALES_ORDER_LINE',
          title: 'SO line',
          creatingNew: true,
          queryParams: const {'sales_order_id': 'so-prefill'},
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('so-prefill'), findsOneWidget);
  });

  testWidgets('EntityRecordScreen invoice shows collect payment and summary', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _InvoiceClient({
            'id': 'inv-1',
            'invoice_number': 'INV-001',
            'customer_id': 'cust-1',
            'status': 'sent',
            'amount': 200,
            'amount_paid': 50,
            'balance_due': 150,
            'record_version': 1,
          }),
          entityCode: 'INVOICE',
          title: 'Invoices',
          recordId: 'inv-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('INV-001'), findsOneWidget);
    expect(find.text(EmcapLocale.t('procurement.payment.summary')), findsOneWidget);
    expect(find.text(EmcapLocale.t('sales.invoice.collect')), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('sales.invoice.collect')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.createRecord')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen record vendor payment opens prefilled create', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _PoClient({
            'id': 'po-1',
            'po_number': 'PO-001',
            'supplier_id': 'sup-1',
            'status': 'received',
            'total_amount': 100,
            'amount_paid': 25,
            'balance_due': 75,
            'record_version': 1,
          }),
          entityCode: 'PURCHASE_ORDER',
          title: 'Purchase orders',
          recordId: 'po-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('procurement.payment.record')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.createRecord')), findsOneWidget);
  });
}

class _SoClient extends EmcapClient {
  _SoClient(this._record);

  final Map<String, dynamic> _record;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    if (entityCode == 'SALES_ORDER_LINE') {
      return salesOrderLineFormMetadataJson();
    }
    return salesOrderFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      Map<String, dynamic>.from(_record);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    if (entityCode == 'SALES_ORDER_LINE') {
      return [
        {
          'id': 'line-1',
          'sales_order_id': 'so-1',
          'product_id': 'prod-1',
          'quantity': 2,
          'unit_price': 15,
        },
      ];
    }
    return [];
  }

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];

  @override
  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> body,
  ) async =>
      {'id': 'new-line', ...body};
}

class _InvoiceClient extends EmcapClient {
  _InvoiceClient(this._record);

  final Map<String, dynamic> _record;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    if (entityCode == 'CUSTOMER_PAYMENT') {
      return customerPaymentFormMetadataJson();
    }
    return invoiceFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      Map<String, dynamic>.from(_record);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [];

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];

  @override
  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> body,
  ) async =>
      {'id': 'new-payment', ...body};
}
