import { DynamicFormRenderer, validateField } from './dynamic-form.renderer';
import type { FormFieldMetadata } from './contract';
import productFieldTypes from '../../assets/fixtures/metadata/product.field-types.json';

interface FieldTypeSpec {
  name: string;
  field_type: string;
  lookup_entity?: string;
  currency_code?: string;
  span?: number;
  options?: string[];
}

interface FieldTypesFixture {
  entity_code: string;
  field_types: FieldTypeSpec[];
}

const fixture = productFieldTypes as FieldTypesFixture;

function fieldFromSpec(spec: FieldTypeSpec): FormFieldMetadata {
  return {
    name: spec.name,
    label: spec.name,
    field_type: spec.field_type,
    required: false,
    row: 0,
    col: 0,
    span: spec.span ?? 6,
    lookup_entity: spec.lookup_entity,
    currency_code: spec.currency_code,
    options: spec.options,
  };
}

describe('product.field-types.json contract', () => {
  it('targets PRODUCT entity', () => {
    expect(fixture.entity_code).toBe('PRODUCT');
    expect(fixture.field_types.length).toBe(4);
  });

  for (const spec of fixture.field_types) {
    it(`parses ${spec.name} as ${spec.field_type}`, () => {
      const field = fieldFromSpec(spec);
      expect(field.field_type).toBe(spec.field_type);
      if (spec.lookup_entity) {
        expect(field.lookup_entity).toBe(spec.lookup_entity);
      }
      if (spec.currency_code) {
        expect(field.currency_code).toBe(spec.currency_code);
      }
      if (spec.options) {
        expect(field.options).toEqual(spec.options);
      }
    });
  }

  it('validates currency field from fixture', () => {
    const spec = fixture.field_types.find((item) => item.field_type === 'currency');
    expect(spec).toBeDefined();
    const field = fieldFromSpec(spec!);
    expect(validateField(field, 'abc')).toContain('valid amount');
    expect(validateField(field, 19.99)).toBeNull();
  });

  it('renders fixture fields in DynamicFormRenderer', () => {
    const renderer = new DynamicFormRenderer({
      schema_version: '1.0',
      entity_code: fixture.entity_code,
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: fixture.field_types.map(fieldFromSpec),
        },
      ],
      conditions: [],
    });
    for (const spec of fixture.field_types) {
      expect(renderer.getField(spec.name)?.field_type).toBe(spec.field_type);
    }
  });
});
