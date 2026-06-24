import 'package:flutter/material.dart';

/// Text button that shows an inline spinner while [busy] instead of looking stuck/disabled.
class BusyTextButton extends StatelessWidget {
  const BusyTextButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.semanticsLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final child = busy
        ? Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Text(label),
            ],
          )
        : Text(label);

    final button = TextButton(
      onPressed: busy ? null : onPressed,
      child: child,
    );

    if (semanticsLabel == null) {
      return button;
    }
    return Semantics(
      label: semanticsLabel,
      button: true,
      enabled: !busy && onPressed != null,
      child: button,
    );
  }
}
