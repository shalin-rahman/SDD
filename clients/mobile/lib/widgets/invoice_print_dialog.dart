import 'package:flutter/material.dart';

import '../services/i18n_service.dart';
import '../utils/export_util.dart';

/// Shows a printable invoice preview dialog (header, fields, footer).
Future<void> showInvoicePrintDialog(
  BuildContext context, {
  required String title,
  required PrintableDocumentBlocks blocks,
  required List<PrintableFieldRow> fields,
}) {
  return showDialog<void>(
    context: context,
    builder: (context) {
      return AlertDialog(
        title: Text(EmcapLocale.t('sales.invoice.printTitle')),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (blocks.header.trim().isNotEmpty) ...[
                  Text(
                    blocks.header,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                ],
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...fields.map(
                  (field) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            field.label,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(field.value),
                        ),
                      ],
                    ),
                  ),
                ),
                if (blocks.footer.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    blocks.footer,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(EmcapLocale.t('common.cancel')),
          ),
        ],
      );
    },
  );
}
