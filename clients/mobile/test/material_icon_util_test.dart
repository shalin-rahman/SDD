import 'package:emcap_mobile/utils/material_icon_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('iconFromMaterialName resolves module menu icons', () {
    expect(iconFromMaterialName('inventory_2'), Icons.inventory_2);
    expect(iconFromMaterialName('person_search'), Icons.person_search);
    expect(iconFromMaterialName('swap_horiz'), Icons.swap_horiz);
  });

  test('iconFromMaterialName falls back for unknown or empty names', () {
    expect(iconFromMaterialName('not_a_real_icon'), Icons.folder);
    expect(iconFromMaterialName(null), Icons.folder);
    expect(iconFromMaterialName(''), Icons.folder);
  });
}
