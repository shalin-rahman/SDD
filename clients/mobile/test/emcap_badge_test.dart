import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/theme/app_tokens.dart';
import 'package:emcap_mobile/widgets/emcap_badge.dart';

Widget _wrap(Widget child, {Brightness brightness = Brightness.light}) {
  return MaterialApp(
    theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: brightness),
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('EmcapBadge web contract', () {
    testWidgets('on variant uses success badge tokens', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapBadge(label: 'Active', variant: EmcapBadgeVariant.on)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      final tokens = EmcapThemeTokens.light;
      expect(decoration.color, tokens.badgeSuccessBg);
      expect(find.text('ACTIVE'), findsOneWidget);
    });

    testWidgets('off variant uses muted surface container', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapBadge(label: 'Inactive', variant: EmcapBadgeVariant.off)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, EmcapThemeTokens.light.surfaceContainer);
    });

    testWidgets('warn variant uses warn badge tokens', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapBadge(label: 'Alert', variant: EmcapBadgeVariant.warn)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, EmcapThemeTokens.light.badgeWarnBg);
    });

    testWidgets('status chip maps active to on variant', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapStatusChip(label: 'Active', active: true)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, EmcapThemeTokens.light.badgeSuccessBg);
    });

    testWidgets('status chip maps inactive to off variant', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapStatusChip(label: 'Inactive', active: false)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, EmcapThemeTokens.light.surfaceContainer);
    });

    testWidgets('badge radius uses token radiusSm', (tester) async {
      await tester.pumpWidget(_wrap(const EmcapBadge(label: 'X', variant: EmcapBadgeVariant.primary)));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration! as BoxDecoration;
      expect(
        (decoration.borderRadius as BorderRadius).topLeft.x,
        EmcapThemeTokens.light.radiusSm,
      );
    });
  });
}
