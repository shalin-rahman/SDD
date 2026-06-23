/// Minimal form/grid JSON for widget screen tests (P18 partials Batch 2).
Map<String, dynamic> productFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'sku',
              'label': 'SKU',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'name',
              'label': 'Name',
              'field_type': 'text',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'active',
              'label': 'Active',
              'field_type': 'checkbox',
              'row': 1,
              'col': 0,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
      'display': {
        'status_field': {
          'field': 'active',
          'active_values': [true],
          'labels': {
            'active': {'en': 'Active'},
            'inactive': {'en': 'Inactive'},
          },
        },
      },
    };

Map<String, dynamic> productGridMetadataJson({
  bool bulkActions = false,
  bool realtime = false,
  bool offline = false,
}) =>
    {
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'columns': [
        {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
        {'field': 'name', 'label': 'Name', 'field_type': 'text'},
      ],
      'bulk_actions': bulkActions,
      'realtime': realtime,
      'offline': offline,
      'export': {'csv': true, 'excel': false, 'pdf': false},
    };

Map<String, dynamic> leadFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'LEAD',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'company',
              'label': 'Company',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'contact_name',
              'label': 'Contact',
              'field_type': 'text',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['new', 'won', 'lost'],
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'active',
              'label': 'Active',
              'field_type': 'checkbox',
              'row': 1,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
      'display': {
        'status_field': {
          'field': 'active',
          'active_values': [true],
          'labels': {
            'active': {'en': 'Active'},
            'inactive': {'en': 'Inactive'},
          },
        },
      },
    };

Map<String, dynamic> stockMovementFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'STOCK_MOVEMENT',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'movement_number',
              'label': 'Number',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['draft', 'posted'],
              'row': 0,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> purchaseOrderFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'PURCHASE_ORDER',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'po_number',
              'label': 'PO Number',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'supplier_id',
              'label': 'Supplier',
              'field_type': 'lookup',
              'lookup_entity': 'SUPPLIER',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['draft', 'submitted', 'received', 'cancelled'],
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'total_amount',
              'label': 'Total',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'amount_paid',
              'label': 'Paid',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 2,
              'col': 0,
              'span': 4,
            },
            {
              'name': 'balance_due',
              'label': 'Balance',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 2,
              'col': 4,
              'span': 4,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> purchaseOrderLineFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'PURCHASE_ORDER_LINE',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'po_id',
              'label': 'Purchase order',
              'field_type': 'lookup',
              'lookup_entity': 'PURCHASE_ORDER',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'product_id',
              'label': 'Product',
              'field_type': 'lookup',
              'lookup_entity': 'PRODUCT',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'quantity',
              'label': 'Quantity',
              'field_type': 'number',
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'unit_price',
              'label': 'Unit price',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> salesOrderFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'SALES_ORDER',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'order_number',
              'label': 'Order number',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'customer_id',
              'label': 'Customer',
              'field_type': 'lookup',
              'lookup_entity': 'CUSTOMER',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['draft', 'confirmed', 'invoiced', 'cancelled'],
              'row': 1,
              'col': 0,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> salesOrderLineFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'SALES_ORDER_LINE',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'sales_order_id',
              'label': 'Sales order',
              'field_type': 'lookup',
              'lookup_entity': 'SALES_ORDER',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'product_id',
              'label': 'Product',
              'field_type': 'lookup',
              'lookup_entity': 'PRODUCT',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'quantity',
              'label': 'Quantity',
              'field_type': 'number',
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'unit_price',
              'label': 'Unit price',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> invoiceFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'INVOICE',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'invoice_number',
              'label': 'Invoice number',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'customer_id',
              'label': 'Customer',
              'field_type': 'lookup',
              'lookup_entity': 'CUSTOMER',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['draft', 'sent', 'partial', 'paid', 'void'],
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'amount',
              'label': 'Amount',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'amount_paid',
              'label': 'Paid',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 2,
              'col': 0,
              'span': 4,
            },
            {
              'name': 'balance_due',
              'label': 'Balance',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 2,
              'col': 4,
              'span': 4,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> customerPaymentFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'CUSTOMER_PAYMENT',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'invoice_id',
              'label': 'Invoice',
              'field_type': 'lookup',
              'lookup_entity': 'INVOICE',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'customer_id',
              'label': 'Customer',
              'field_type': 'lookup',
              'lookup_entity': 'CUSTOMER',
              'row': 0,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> journalEntryFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'JOURNAL_ENTRY',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'reference',
              'label': 'Reference',
              'field_type': 'text',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'source_type',
              'label': 'Source',
              'field_type': 'select',
              'options': ['manual', 'vendor_payment', 'customer_payment'],
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'status',
              'label': 'Status',
              'field_type': 'select',
              'options': ['draft', 'posted', 'void'],
              'row': 1,
              'col': 0,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };

Map<String, dynamic> journalEntryLineFormMetadataJson() => {
      'schema_version': '1.0',
      'entity_code': 'JOURNAL_ENTRY_LINE',
      'sections': [
        {
          'code': 'main',
          'label': 'Main',
          'fields': [
            {
              'name': 'journal_entry_id',
              'label': 'Journal entry',
              'field_type': 'lookup',
              'lookup_entity': 'JOURNAL_ENTRY',
              'row': 0,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'account_id',
              'label': 'Account',
              'field_type': 'lookup',
              'lookup_entity': 'ACCOUNT',
              'row': 0,
              'col': 6,
              'span': 6,
            },
            {
              'name': 'debit',
              'label': 'Debit',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 0,
              'span': 6,
            },
            {
              'name': 'credit',
              'label': 'Credit',
              'field_type': 'currency',
              'currency_code': 'USD',
              'row': 1,
              'col': 6,
              'span': 6,
            },
          ],
        },
      ],
      'conditions': [],
    };
