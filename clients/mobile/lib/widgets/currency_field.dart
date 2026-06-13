import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../metadata_contract.dart';
import '../utils/lookup_display.dart';

class CurrencyField extends StatelessWidget {
  const CurrencyField({
    super.key,
    required this.field,
    required this.label,
    required this.controller,
  });

  final FormFieldMetadata field;
  final String label;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final currencyCode = field.currencyCode ?? currencyCodeFromField(field.toMap());
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixText: '$currencyCode ',
        border: const OutlineInputBorder(),
      ),
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
      ],
    );
  }
}

class TextareaField extends StatelessWidget {
  const TextareaField({
    super.key,
    required this.label,
    required this.controller,
    this.minLines = 4,
  });

  final String label;
  final TextEditingController controller;
  final int minLines;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        alignLabelWithHint: true,
      ),
      keyboardType: TextInputType.multiline,
      maxLines: null,
      minLines: minLines,
    );
  }
}
