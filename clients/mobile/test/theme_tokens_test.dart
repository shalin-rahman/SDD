import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/theme/app_tokens.dart';
import 'package:emcap_mobile/theme.dart';

void main() {
  group('EmcapThemeTokens', () {
    test('light palette exposes all web color keys', () {
      final tokens = EmcapThemeTokens.light;
      for (final key in EmcapThemeTokens.colorKeys) {
        expect(_colorForKey(tokens, key), isNotNull, reason: key);
      }
    });

    test('dark palette exposes all web color keys', () {
      final tokens = EmcapThemeTokens.dark;
      for (final key in EmcapThemeTokens.colorKeys) {
        expect(_colorForKey(tokens, key), isNotNull, reason: key);
      }
    });

    test('spacing scale matches 4px grid', () {
      final tokens = EmcapThemeTokens.light;
      expect(tokens.spaceXs, 4);
      expect(tokens.spaceSm, 8);
      expect(tokens.spaceMd, 16);
      expect(tokens.spaceLg, 24);
      expect(tokens.spaceXl, 32);
      for (final key in EmcapThemeTokens.spacingKeys) {
        expect(_spacingForKey(tokens, key), greaterThan(0), reason: key);
      }
    });

    test('radius keys are positive', () {
      final tokens = EmcapThemeTokens.light;
      for (final key in EmcapThemeTokens.radiusKeys) {
        expect(_radiusForKey(tokens, key), greaterThan(0), reason: key);
      }
    });

    test('compact density reduces row padding', () {
      expect(
        EmcapThemeTokens.compactLight.densityRowPaddingY,
        lessThan(EmcapThemeTokens.light.densityRowPaddingY),
      );
      expect(EmcapThemeTokens.compactLight.compact, isTrue);
    });

    test('compact density reduces horizontal grid padding', () {
      expect(
        EmcapThemeTokens.compactLight.densityRowPaddingX,
        lessThan(EmcapThemeTokens.light.densityRowPaddingX),
      );
      expect(
        EmcapThemeTokens.compactLight.densityHeaderPaddingY,
        lessThan(EmcapThemeTokens.light.densityHeaderPaddingY),
      );
    });

    test('forBrightness compact selects compact palettes', () {
      expect(EmcapThemeTokens.forBrightness(Brightness.light, compact: true).compact, isTrue);
      expect(
        EmcapThemeTokens.forBrightness(Brightness.dark, compact: true).densityRowPaddingY,
        EmcapThemeTokens.compactDark.densityRowPaddingY,
      );
    });

    test('ThemeExtension is registered on MaterialApp theme', () {
      final theme = EmcapTheme.buildThemeData(
        seed: Colors.indigo,
        brightness: Brightness.light,
      );
      final ext = theme.extension<EmcapThemeTokens>();
      expect(ext, isNotNull);
      expect(ext!.primary, const Color(0xFF005CBB));
    });

    test('forBrightness selects light vs dark', () {
      expect(
        EmcapThemeTokens.forBrightness(Brightness.dark).surface,
        EmcapThemeTokens.dark.surface,
      );
      expect(
        EmcapThemeTokens.forBrightness(Brightness.light).surface,
        EmcapThemeTokens.light.surface,
      );
    });
  });
}

Color? _colorForKey(EmcapThemeTokens tokens, String key) {
  switch (key) {
    case 'primary':
      return tokens.primary;
    case 'border':
      return tokens.border;
    case 'surface':
      return tokens.surface;
    case 'text':
      return tokens.text;
    case 'textMuted':
      return tokens.textMuted;
    case 'error':
      return tokens.error;
    case 'success':
      return tokens.success;
    case 'onPrimary':
      return tokens.onPrimary;
    case 'surfaceContainer':
      return tokens.surfaceContainer;
    case 'panelSurface':
      return tokens.panelSurface;
    case 'badgeSuccessBg':
      return tokens.badgeSuccessBg;
    case 'badgeSuccessFg':
      return tokens.badgeSuccessFg;
    case 'badgeWarnBg':
      return tokens.badgeWarnBg;
    case 'badgeWarnFg':
      return tokens.badgeWarnFg;
    case 'badgeErrorBg':
      return tokens.badgeErrorBg;
    case 'badgeErrorFg':
      return tokens.badgeErrorFg;
    default:
      return null;
  }
}

double? _spacingForKey(EmcapThemeTokens tokens, String key) {
  switch (key) {
    case 'spaceXs':
      return tokens.spaceXs;
    case 'spaceSm':
      return tokens.spaceSm;
    case 'spaceMd':
      return tokens.spaceMd;
    case 'spaceLg':
      return tokens.spaceLg;
    case 'spaceXl':
      return tokens.spaceXl;
    default:
      return null;
  }
}

double? _radiusForKey(EmcapThemeTokens tokens, String key) {
  switch (key) {
    case 'radiusSm':
      return tokens.radiusSm;
    case 'radiusMd':
      return tokens.radiusMd;
    case 'radiusCard':
      return tokens.radiusCard;
    case 'radiusFull':
      return tokens.radiusFull;
    default:
      return null;
  }
}
