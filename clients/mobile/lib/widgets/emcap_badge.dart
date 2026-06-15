import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';

/// Web `.emcap-badge` parity — on / off / warn variants (P16-T05/T06).
enum EmcapBadgeVariant { primary, on, off, warn }

class EmcapBadge extends StatelessWidget {
  const EmcapBadge({
    super.key,
    required this.label,
    this.variant = EmcapBadgeVariant.primary,
  });

  final String label;
  final EmcapBadgeVariant variant;

  @override
  Widget build(BuildContext context) {
    final tokens = context.emcapTokens;
    final (bg, fg) = _colors(tokens, variant);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs + 2, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(tokens.radiusSm),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: tokens.fontLabelSm,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
          color: fg,
        ),
      ),
    );
  }

  static (Color bg, Color fg) _colors(EmcapThemeTokens tokens, EmcapBadgeVariant variant) {
    switch (variant) {
      case EmcapBadgeVariant.on:
        return (tokens.badgeSuccessBg, tokens.badgeSuccessFg);
      case EmcapBadgeVariant.off:
        return (tokens.surfaceContainer, tokens.textMuted);
      case EmcapBadgeVariant.warn:
        return (tokens.badgeWarnBg, tokens.badgeWarnFg);
      case EmcapBadgeVariant.primary:
        return (tokens.primary.withOpacity(0.12), tokens.primary);
    }
  }
}

/// Status chip using badge token semantics (active → on, inactive → off).
class EmcapStatusChip extends StatelessWidget {
  const EmcapStatusChip({super.key, required this.label, required this.active});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return EmcapBadge(
      label: label,
      variant: active ? EmcapBadgeVariant.on : EmcapBadgeVariant.off,
    );
  }
}
