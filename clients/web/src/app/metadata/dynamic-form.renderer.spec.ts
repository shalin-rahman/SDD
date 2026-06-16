import { DynamicFormRenderer, validateField } from './dynamic-form.renderer';
import type { FormFieldMetadata, FormMetadata } from './contract';

const sampleForm: FormMetadata = {
  schema_version: '1.0',
  entity_code: 'PRODUCT',
  sections: [
    {
      code: 'main',
      label: 'Main',
      fields: [
        {
          name: 'sku',
          label: 'SKU',
          field_type: 'text',
          required: true,
          row: 0,
          col: 0,
          span: 6,
          validation: [{ rule: 'required', message: 'SKU is required' }],
        },
        {
          name: 'email',
          label: 'Email',
          field_type: 'email',
          required: false,
          row: 0,
          col: 6,
          span: 6,
          validation: [{ rule: 'email', message: 'Invalid email' }],
        },
      ],
    },
  ],
  conditions: [
    { field: 'active', operator: 'equals', value: true, action: 'show', targets: ['email'] },
  ],
  i18n: { en: { title: 'Product' } },
};

describe('DynamicFormRenderer', () => {
  it('validates required fields', () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    const errors = renderer.validate({ sku: '' });
    expect(errors.sku).toBe('SKU is required');
  });

  it('hides conditional fields', () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    expect(renderer.isVisible('email', { active: false })).toBe(false);
    expect(renderer.isVisible('email', { active: true })).toBe(true);
  });

  it('validates email rule', () => {
    const field = sampleForm.sections[0].fields[1];
    expect(validateField(field, 'bad')).toBe('Invalid email');
    expect(validateField(field, 'a@b.com')).toBeNull();
  });

  it('applies layout grid row/col/span', () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    const sku = renderer.getField('sku');
    expect(renderer.layoutStyle(sku!)).toEqual({ gridColumn: '1 / 7', gridRow: '1' });
    const email = renderer.getField('email');
    expect(renderer.layoutStyle(email!)).toEqual({ gridColumn: '7 / 13', gridRow: '1' });
  });

  it('validates currency amounts', () => {
    const field: FormFieldMetadata = {
      name: 'unit_price',
      label: 'Unit Price',
      field_type: 'currency',
      required: false,
      row: 0,
      col: 0,
      span: 6,
      currency_code: 'USD',
    };
    expect(validateField(field, 'abc')).toBe('Unit Price must be a valid amount');
    expect(validateField(field, 19.99)).toBeNull();
  });

  it('exposes metadata helpers and input elements', () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    expect(renderer.formMetadata().entity_code).toBe('PRODUCT');
    expect(renderer.sectionLabel('main')).toBe('Main');
    expect(renderer.fieldNames()).toEqual(['sku', 'email']);
    expect(renderer.label('sku')).toBe('SKU');
    expect(renderer.isRequired('sku')).toBeTrue();
    expect(renderer.isReadOnly('sku')).toBeFalse();
    expect(renderer.visibleFieldNames({ active: true })).toContain('email');

    const checkbox = renderer.createInputElement(
      { ...sampleForm.sections[0].fields[0], field_type: 'checkbox', required: false },
      true,
    );
    expect((checkbox as HTMLInputElement).checked).toBeTrue();

    const textarea = renderer.createInputElement(
      { ...sampleForm.sections[0].fields[0], field_type: 'textarea', required: false },
      'hello',
    );
    expect((textarea as unknown as HTMLTextAreaElement).value).toBe('hello');
  });

  it('validates min rule and hide conditions', () => {
    const minField: FormFieldMetadata = {
      name: 'qty',
      label: 'Qty',
      field_type: 'number',
      required: false,
      row: 0,
      col: 0,
      span: 6,
      validation: [{ rule: 'min', value: 5, message: 'Minimum 5' }],
    };
    expect(validateField(minField, '2')).toBe('Minimum 5');

    const hideForm: FormMetadata = {
      ...sampleForm,
      conditions: [
        { field: 'active', operator: 'not_equals', value: true, action: 'hide', targets: ['email'] },
      ],
    };
    const renderer = new DynamicFormRenderer(hideForm);
    expect(renderer.isVisible('email', { active: false })).toBeFalse();
    expect(renderer.validate({ sku: '', active: true }).sku).toBe('SKU is required');
  });

  it('covers read-only, lookup, and default condition branches', () => {
    const readOnlyForm: FormMetadata = {
      ...sampleForm,
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: [
            {
              name: 'sku',
              label: 'SKU',
              field_type: 'text',
              required: true,
              read_only: true,
              row: 0,
              col: 0,
              span: 6,
            },
          ],
        },
      ],
      conditions: [
        { field: 'flag', operator: 'equals', value: 'x', action: 'show', targets: ['sku'] },
      ],
    };
    const renderer = new DynamicFormRenderer(readOnlyForm, 'fr');
    expect(renderer.sectionLabel('missing')).toBe('missing');
    expect(renderer.isReadOnly('sku')).toBeTrue();
    expect(renderer.validate({ sku: '' })).toEqual({});

    const lookup = renderer.createInputElement(
      { name: 'vendor', label: 'Vendor', field_type: 'lookup', required: false, row: 0, col: 0, span: 6 },
      'v-1',
    );
    expect((lookup as HTMLInputElement).value).toBe('v-1');

    const numberInput = renderer.createInputElement(
      { name: 'qty', label: 'Qty', field_type: 'number', required: false, row: 0, col: 0, span: 6 },
      3,
    );
    expect((numberInput as HTMLInputElement).type).toBe('number');

    const defaultCondForm: FormMetadata = {
      ...sampleForm,
      conditions: [{ field: 'flag', operator: 'equals', value: true, action: 'show', targets: ['email'] }],
    };
    expect(new DynamicFormRenderer(defaultCondForm).isVisible('email', { flag: true })).toBeTrue();
  });

  it('evaluates default condition operator via truthy field value', () => {
    const truthyForm: FormMetadata = {
      ...sampleForm,
      conditions: [{ field: 'flag', operator: 'truthy', value: true, action: 'show', targets: ['email'] }],
    };
    const renderer = new DynamicFormRenderer(truthyForm);
    expect(renderer.isVisible('email', { flag: 'yes' })).toBeTrue();
    expect(renderer.isVisible('email', { flag: '' })).toBeFalse();
  });

  it('coerces equals operator with string comparison', () => {
    const coerceForm: FormMetadata = {
      ...sampleForm,
      conditions: [{ field: 'qty', operator: 'equals', value: 5, action: 'show', targets: ['email'] }],
    };
    expect(new DynamicFormRenderer(coerceForm).isVisible('email', { qty: '5' })).toBeTrue();
  });

  it('uses localized section labels and creates date/email inputs', () => {
    const i18nForm: FormMetadata = {
      ...sampleForm,
      i18n: { en: { 'section.main': 'Primary' } },
    };
    const renderer = new DynamicFormRenderer(i18nForm);
    expect(renderer.sectionLabel('main')).toBe('Primary');

    const dateInput = renderer.createInputElement(
      { name: 'due', label: 'Due', field_type: 'date', required: false, row: 0, col: 0, span: 6 },
      '2026-06-14',
    );
    expect((dateInput as HTMLInputElement).type).toBe('date');

    const emailInput = renderer.createInputElement(
      { name: 'email', label: 'Email', field_type: 'email', required: false, row: 0, col: 0, span: 6 },
      'a@b.com',
    );
    expect((emailInput as HTMLInputElement).type).toBe('email');

    const currencyInput = renderer.createInputElement(
      { name: 'price', label: 'Price', field_type: 'currency', required: false, row: 0, col: 0, span: 6 },
      9.99,
    );
    expect((currencyInput as HTMLInputElement).type).toBe('number');
  });

  it('uses default required message when validation rule is missing', () => {
    const field: FormFieldMetadata = {
      name: 'name',
      label: 'Name',
      field_type: 'text',
      required: true,
      row: 0,
      col: 0,
      span: 6,
    };
    expect(validateField(field, '')).toBe('Name is required');
    expect(validateField(field, 'ok')).toBeNull();
  });
});
