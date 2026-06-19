import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Mobile-only keys until web sync in P27-T03/T06 (seed catalog + sales entity lines).
const _knownMobileOnlyPrefixes = [
  'a11y.',
  'ux.',
  'tech.',
  'security.',
  'deployment.',
  'org.',
  'number.',
  'date.',
];
const _knownMobileOnlyExact = {
  'entity.addLine',
  'sales.so.linesEmpty',
  'sales.so.linesFailed',
  'settings.organization.logoUploadUnavailable',
};

bool _isKnownMobileOnly(String key) {
  if (_knownMobileOnlyExact.contains(key)) return true;
  return _knownMobileOnlyPrefixes.any(key.startsWith);
}

/// P27 — web/mobile BCP 47 bundle parity (Wave 1: mobile must contain all web keys).
void main() {
  const bcp47Locales = ['en-US', 'bn-BD', 'fr-FR'];

  late Directory repoRoot;
  late Directory webDir;
  late Directory mobileDir;

  setUpAll(() {
    repoRoot = Directory.current.path.contains('clients${Platform.pathSeparator}mobile')
        ? Directory('..${Platform.pathSeparator}..')
        : Directory('.');
    webDir = Directory(
      '${repoRoot.path}${Platform.pathSeparator}clients${Platform.pathSeparator}web${Platform.pathSeparator}src${Platform.pathSeparator}assets${Platform.pathSeparator}i18n',
    );
    mobileDir = Directory('assets${Platform.pathSeparator}i18n');
  });

  for (final tag in bcp47Locales) {
    test('mobile $tag contains every web key', () {
      final webKeys = _loadJson('${webDir.path}${Platform.pathSeparator}$tag.json').keys.toSet();
      final mobileKeys = _loadJson('${mobileDir.path}${Platform.pathSeparator}$tag.json').keys.toSet();
      final missingOnMobile = webKeys.difference(mobileKeys);
      expect(missingOnMobile, isEmpty, reason: '$tag missing on mobile: $missingOnMobile');
    });
  }

  test('mobile-only drift is limited to known keys', () {
    final webEn = _loadJson('${webDir.path}${Platform.pathSeparator}en-US.json').keys.toSet();
    final mobileEn = _loadJson('${mobileDir.path}${Platform.pathSeparator}en-US.json').keys.toSet();
    final mobileOnly = mobileEn.difference(webEn);
    final unexpected = mobileOnly.where((k) => !_isKnownMobileOnly(k)).toSet();
    expect(unexpected, isEmpty, reason: 'unexpected mobile-only keys: $unexpected');
  });

  test('bn-BD settings.organization.* parity with web', () {
    final webBn = _loadJson('${webDir.path}${Platform.pathSeparator}bn-BD.json');
    final mobileBn = _loadJson('${mobileDir.path}${Platform.pathSeparator}bn-BD.json');
    final orgWebKeys = webBn.keys.where((k) => k.startsWith('settings.organization.')).toSet();
    final orgMobileKeys = mobileBn.keys.where((k) => k.startsWith('settings.organization.')).toSet();
    expect(orgMobileKeys.containsAll(orgWebKeys), isTrue, reason: 'mobile missing org keys: ${orgWebKeys.difference(orgMobileKeys)}');
  });
}

Map<String, dynamic> _loadJson(String path) {
  final file = File(path);
  expect(file.existsSync(), isTrue, reason: 'missing bundle $path');
  return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
}
