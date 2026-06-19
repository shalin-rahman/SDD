import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

/// EMCAP design tokens — ADR-006 parity with `clients/web/src/styles/_tokens.scss`.
@immutable
class EmcapThemeTokens extends ThemeExtension<EmcapThemeTokens> {
  const EmcapThemeTokens({
    required this.primary,
    required this.border,
    required this.surface,
    required this.text,
    required this.textMuted,
    required this.error,
    required this.success,
    required this.onPrimary,
    required this.surfaceContainer,
    required this.panelSurface,
    required this.badgeSuccessBg,
    required this.badgeSuccessFg,
    required this.badgeWarnBg,
    required this.badgeWarnFg,
    required this.badgeErrorBg,
    required this.badgeErrorFg,
    required this.spaceXs,
    required this.spaceSm,
    required this.spaceMd,
    required this.spaceLg,
    required this.spaceXl,
    required this.radiusSm,
    required this.radiusMd,
    required this.radiusCard,
    required this.radiusFull,
    required this.fontTitleLg,
    required this.fontTitleMd,
    required this.fontBodyMd,
    required this.fontBodySm,
    required this.fontLabelSm,
    required this.elevation1,
    required this.elevation2,
    required this.densityRowPaddingY,
    required this.densityRowPaddingX,
    required this.densityHeaderPaddingY,
    required this.compact,
  });

  // Color roles
  final Color primary;
  final Color border;
  final Color surface;
  final Color text;
  final Color textMuted;
  final Color error;
  final Color success;
  final Color onPrimary;
  final Color surfaceContainer;
  final Color panelSurface;
  final Color badgeSuccessBg;
  final Color badgeSuccessFg;
  final Color badgeWarnBg;
  final Color badgeWarnFg;
  final Color badgeErrorBg;
  final Color badgeErrorFg;

  // Spacing (4px grid, 16px rem base)
  final double spaceXs;
  final double spaceSm;
  final double spaceMd;
  final double spaceLg;
  final double spaceXl;

  // Shape
  final double radiusSm;
  final double radiusMd;
  final double radiusCard;
  final double radiusFull;

  // Typography sizes
  final double fontTitleLg;
  final double fontTitleMd;
  final double fontBodyMd;
  final double fontBodySm;
  final double fontLabelSm;

  // Elevation (Material uses double)
  final double elevation1;
  final double elevation2;

  // Density
  final double densityRowPaddingY;
  final double densityRowPaddingX;
  final double densityHeaderPaddingY;
  final bool compact;

  static const light = EmcapThemeTokens(
    primary: Color(0xFF005CBB),
    border: Color(0xFFE0E0E0),
    surface: Color(0xFFFAFAFA),
    text: Color(0xFF1A1A1A),
    textMuted: Color(0xFF5F6368),
    error: Color(0xFFB00020),
    success: Color(0xFF1B5E20),
    onPrimary: Color(0xFFFFFFFF),
    surfaceContainer: Color(0xFFF0F2F5),
    panelSurface: Color(0xFFFFFFFF),
    badgeSuccessBg: Color(0xFFE6F4EA),
    badgeSuccessFg: Color(0xFF137333),
    badgeWarnBg: Color(0xFFFEF7E0),
    badgeWarnFg: Color(0xFFB06000),
    badgeErrorBg: Color(0xFFFCE8E6),
    badgeErrorFg: Color(0xFFC5221F),
    spaceXs: 4,
    spaceSm: 8,
    spaceMd: 16,
    spaceLg: 24,
    spaceXl: 32,
    radiusSm: 4,
    radiusMd: 8,
    radiusCard: 12,
    radiusFull: 9999,
    fontTitleLg: 20,
    fontTitleMd: 18,
    fontBodyMd: 16,
    fontBodySm: 14,
    fontLabelSm: 12,
    elevation1: 1,
    elevation2: 2,
    densityRowPaddingY: 8.8,
    densityRowPaddingX: 12,
    densityHeaderPaddingY: 10.4,
    compact: false,
  );

  static const dark = EmcapThemeTokens(
    primary: Color(0xFF8AB4F8),
    border: Color(0xFF3A3A3A),
    surface: Color(0xFF121212),
    text: Color(0xFFF5F5F5),
    textMuted: Color(0xFFB0B6BC),
    error: Color(0xFFF28B82),
    success: Color(0xFF81C995),
    onPrimary: Color(0xFF121212),
    surfaceContainer: Color(0xFF2A2A2A),
    panelSurface: Color(0xFF1E1E1E),
    badgeSuccessBg: Color(0xFF1E3324),
    badgeSuccessFg: Color(0xFFB7E1C1),
    badgeWarnBg: Color(0xFF332E1A),
    badgeWarnFg: Color(0xFFFDD663),
    badgeErrorBg: Color(0xFF3A2220),
    badgeErrorFg: Color(0xFFF9DEDC),
    spaceXs: 4,
    spaceSm: 8,
    spaceMd: 16,
    spaceLg: 24,
    spaceXl: 32,
    radiusSm: 4,
    radiusMd: 8,
    radiusCard: 12,
    radiusFull: 9999,
    fontTitleLg: 20,
    fontTitleMd: 18,
    fontBodyMd: 16,
    fontBodySm: 14,
    fontLabelSm: 12,
    elevation1: 1,
    elevation2: 2,
    densityRowPaddingY: 8.8,
    densityRowPaddingX: 12,
    densityHeaderPaddingY: 10.4,
    compact: false,
  );

  static const compactLight = EmcapThemeTokens(
    primary: Color(0xFF005CBB),
    border: Color(0xFFE0E0E0),
    surface: Color(0xFFFAFAFA),
    text: Color(0xFF1A1A1A),
    textMuted: Color(0xFF5F6368),
    error: Color(0xFFB00020),
    success: Color(0xFF1B5E20),
    onPrimary: Color(0xFFFFFFFF),
    surfaceContainer: Color(0xFFF0F2F5),
    panelSurface: Color(0xFFFFFFFF),
    badgeSuccessBg: Color(0xFFE6F4EA),
    badgeSuccessFg: Color(0xFF137333),
    badgeWarnBg: Color(0xFFFEF7E0),
    badgeWarnFg: Color(0xFFB06000),
    badgeErrorBg: Color(0xFFFCE8E6),
    badgeErrorFg: Color(0xFFC5221F),
    spaceXs: 4,
    spaceSm: 8,
    spaceMd: 12,
    spaceLg: 18,
    spaceXl: 32,
    radiusSm: 4,
    radiusMd: 8,
    radiusCard: 12,
    radiusFull: 9999,
    fontTitleLg: 20,
    fontTitleMd: 18,
    fontBodyMd: 16,
    fontBodySm: 14,
    fontLabelSm: 12,
    elevation1: 1,
    elevation2: 2,
    densityRowPaddingY: 5.6,
    densityRowPaddingX: 8,
    densityHeaderPaddingY: 7.2,
    compact: true,
  );

  static const compactDark = EmcapThemeTokens(
    primary: Color(0xFF8AB4F8),
    border: Color(0xFF3A3A3A),
    surface: Color(0xFF121212),
    text: Color(0xFFF5F5F5),
    textMuted: Color(0xFFB0B6BC),
    error: Color(0xFFF28B82),
    success: Color(0xFF81C995),
    onPrimary: Color(0xFF121212),
    surfaceContainer: Color(0xFF2A2A2A),
    panelSurface: Color(0xFF1E1E1E),
    badgeSuccessBg: Color(0xFF1E3324),
    badgeSuccessFg: Color(0xFFB7E1C1),
    badgeWarnBg: Color(0xFF332E1A),
    badgeWarnFg: Color(0xFFFDD663),
    badgeErrorBg: Color(0xFF3A2220),
    badgeErrorFg: Color(0xFFF9DEDC),
    spaceXs: 4,
    spaceSm: 8,
    spaceMd: 12,
    spaceLg: 18,
    spaceXl: 32,
    radiusSm: 4,
    radiusMd: 8,
    radiusCard: 12,
    radiusFull: 9999,
    fontTitleLg: 20,
    fontTitleMd: 18,
    fontBodyMd: 16,
    fontBodySm: 14,
    fontLabelSm: 12,
    elevation1: 1,
    elevation2: 2,
    densityRowPaddingY: 5.6,
    densityRowPaddingX: 8,
    densityHeaderPaddingY: 7.2,
    compact: true,
  );

  static EmcapThemeTokens forBrightness(Brightness brightness, {bool compact = false}) {
    if (compact) {
      return brightness == Brightness.dark ? compactDark : compactLight;
    }
    return brightness == Brightness.dark ? dark : light;
  }

  /// Semantic token keys mirrored from web `--emcap-*` (for contract tests).
  static const colorKeys = [
    'primary',
    'border',
    'surface',
    'text',
    'textMuted',
    'error',
    'success',
    'onPrimary',
    'surfaceContainer',
    'panelSurface',
    'badgeSuccessBg',
    'badgeSuccessFg',
    'badgeWarnBg',
    'badgeWarnFg',
    'badgeErrorBg',
    'badgeErrorFg',
  ];

  static const spacingKeys = ['spaceXs', 'spaceSm', 'spaceMd', 'spaceLg', 'spaceXl'];

  static const radiusKeys = ['radiusSm', 'radiusMd', 'radiusCard', 'radiusFull'];

  @override
  EmcapThemeTokens copyWith({
    Color? primary,
    Color? border,
    Color? surface,
    Color? text,
    Color? textMuted,
    Color? error,
    Color? success,
    Color? onPrimary,
    Color? surfaceContainer,
    Color? panelSurface,
    Color? badgeSuccessBg,
    Color? badgeSuccessFg,
    Color? badgeWarnBg,
    Color? badgeWarnFg,
    Color? badgeErrorBg,
    Color? badgeErrorFg,
    double? spaceXs,
    double? spaceSm,
    double? spaceMd,
    double? spaceLg,
    double? spaceXl,
    double? radiusSm,
    double? radiusMd,
    double? radiusCard,
    double? radiusFull,
    double? fontTitleLg,
    double? fontTitleMd,
    double? fontBodyMd,
    double? fontBodySm,
    double? fontLabelSm,
    double? elevation1,
    double? elevation2,
    double? densityRowPaddingY,
    double? densityRowPaddingX,
    double? densityHeaderPaddingY,
    bool? compact,
  }) {
    return EmcapThemeTokens(
      primary: primary ?? this.primary,
      border: border ?? this.border,
      surface: surface ?? this.surface,
      text: text ?? this.text,
      textMuted: textMuted ?? this.textMuted,
      error: error ?? this.error,
      success: success ?? this.success,
      onPrimary: onPrimary ?? this.onPrimary,
      surfaceContainer: surfaceContainer ?? this.surfaceContainer,
      panelSurface: panelSurface ?? this.panelSurface,
      badgeSuccessBg: badgeSuccessBg ?? this.badgeSuccessBg,
      badgeSuccessFg: badgeSuccessFg ?? this.badgeSuccessFg,
      badgeWarnBg: badgeWarnBg ?? this.badgeWarnBg,
      badgeWarnFg: badgeWarnFg ?? this.badgeWarnFg,
      badgeErrorBg: badgeErrorBg ?? this.badgeErrorBg,
      badgeErrorFg: badgeErrorFg ?? this.badgeErrorFg,
      spaceXs: spaceXs ?? this.spaceXs,
      spaceSm: spaceSm ?? this.spaceSm,
      spaceMd: spaceMd ?? this.spaceMd,
      spaceLg: spaceLg ?? this.spaceLg,
      spaceXl: spaceXl ?? this.spaceXl,
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusCard: radiusCard ?? this.radiusCard,
      radiusFull: radiusFull ?? this.radiusFull,
      fontTitleLg: fontTitleLg ?? this.fontTitleLg,
      fontTitleMd: fontTitleMd ?? this.fontTitleMd,
      fontBodyMd: fontBodyMd ?? this.fontBodyMd,
      fontBodySm: fontBodySm ?? this.fontBodySm,
      fontLabelSm: fontLabelSm ?? this.fontLabelSm,
      elevation1: elevation1 ?? this.elevation1,
      elevation2: elevation2 ?? this.elevation2,
      densityRowPaddingY: densityRowPaddingY ?? this.densityRowPaddingY,
      densityRowPaddingX: densityRowPaddingX ?? this.densityRowPaddingX,
      densityHeaderPaddingY: densityHeaderPaddingY ?? this.densityHeaderPaddingY,
      compact: compact ?? this.compact,
    );
  }

  @override
  EmcapThemeTokens lerp(ThemeExtension<EmcapThemeTokens>? other, double t) {
    if (other is! EmcapThemeTokens) return this;
    return EmcapThemeTokens(
      primary: Color.lerp(primary, other.primary, t)!,
      border: Color.lerp(border, other.border, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      text: Color.lerp(text, other.text, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      error: Color.lerp(error, other.error, t)!,
      success: Color.lerp(success, other.success, t)!,
      onPrimary: Color.lerp(onPrimary, other.onPrimary, t)!,
      surfaceContainer: Color.lerp(surfaceContainer, other.surfaceContainer, t)!,
      panelSurface: Color.lerp(panelSurface, other.panelSurface, t)!,
      badgeSuccessBg: Color.lerp(badgeSuccessBg, other.badgeSuccessBg, t)!,
      badgeSuccessFg: Color.lerp(badgeSuccessFg, other.badgeSuccessFg, t)!,
      badgeWarnBg: Color.lerp(badgeWarnBg, other.badgeWarnBg, t)!,
      badgeWarnFg: Color.lerp(badgeWarnFg, other.badgeWarnFg, t)!,
      badgeErrorBg: Color.lerp(badgeErrorBg, other.badgeErrorBg, t)!,
      badgeErrorFg: Color.lerp(badgeErrorFg, other.badgeErrorFg, t)!,
      spaceXs: lerpDouble(spaceXs, other.spaceXs, t)!,
      spaceSm: lerpDouble(spaceSm, other.spaceSm, t)!,
      spaceMd: lerpDouble(spaceMd, other.spaceMd, t)!,
      spaceLg: lerpDouble(spaceLg, other.spaceLg, t)!,
      spaceXl: lerpDouble(spaceXl, other.spaceXl, t)!,
      radiusSm: lerpDouble(radiusSm, other.radiusSm, t)!,
      radiusMd: lerpDouble(radiusMd, other.radiusMd, t)!,
      radiusCard: lerpDouble(radiusCard, other.radiusCard, t)!,
      radiusFull: lerpDouble(radiusFull, other.radiusFull, t)!,
      fontTitleLg: lerpDouble(fontTitleLg, other.fontTitleLg, t)!,
      fontTitleMd: lerpDouble(fontTitleMd, other.fontTitleMd, t)!,
      fontBodyMd: lerpDouble(fontBodyMd, other.fontBodyMd, t)!,
      fontBodySm: lerpDouble(fontBodySm, other.fontBodySm, t)!,
      fontLabelSm: lerpDouble(fontLabelSm, other.fontLabelSm, t)!,
      elevation1: lerpDouble(elevation1, other.elevation1, t)!,
      elevation2: lerpDouble(elevation2, other.elevation2, t)!,
      densityRowPaddingY: lerpDouble(densityRowPaddingY, other.densityRowPaddingY, t)!,
      densityRowPaddingX: lerpDouble(densityRowPaddingX, other.densityRowPaddingX, t)!,
      densityHeaderPaddingY: lerpDouble(densityHeaderPaddingY, other.densityHeaderPaddingY, t)!,
      compact: t < 0.5 ? compact : other.compact,
    );
  }
}

extension EmcapThemeTokensContext on BuildContext {
  EmcapThemeTokens get emcapTokens =>
      Theme.of(this).extension<EmcapThemeTokens>() ?? EmcapThemeTokens.light;
}
