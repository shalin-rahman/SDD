import 'package:flutter/material.dart';

class MasterDetailLayout extends StatelessWidget {
  const MasterDetailLayout({
    super.key,
    required this.listPane,
    required this.detailPane,
    this.detailOpen = false,
    this.onBack,
  });

  final Widget listPane;
  final Widget detailPane;
  final bool detailOpen;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 2, child: listPane),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: Card(
                  margin: EdgeInsets.zero,
                  child: detailPane,
                ),
              ),
            ],
          );
        }
        if (detailOpen) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (onBack != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: onBack,
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Back to list'),
                  ),
                ),
              Expanded(child: detailPane),
            ],
          );
        }
        return listPane;
      },
    );
  }
}
