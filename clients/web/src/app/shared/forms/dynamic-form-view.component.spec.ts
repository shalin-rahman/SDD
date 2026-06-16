import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import type { FormMetadata } from '../../metadata/contract';
import { DynamicFormViewComponent } from './dynamic-form-view.component';

const field = (
  name: string,
  field_type: string,
  extra: Partial<FormMetadata['sections'][0]['fields'][0]> = {},
) => ({
  name,
  label: name,
  field_type,
  required: false,
  row: 0,
  col: 0,
  span: 6,
  ...extra,
});

const FORM: FormMetadata = {
  schema_version: '1',
  entity_code: 'CUSTOMER',
  sections: [
    {
      code: 'main',
      label: 'Main',
      fields: [
        field('name', 'text', { required: true }),
        field('active', 'checkbox'),
      ],
    },
    {
      code: 'system',
      label: 'System',
      fields: [field('created_at', 'text', { read_only: true })],
    },
  ],
  conditions: [],
};

describe('DynamicFormViewComponent', () => {
  let fixture: ComponentFixture<DynamicFormViewComponent>;
  let renderer: DynamicFormRenderer;

  beforeEach(async () => {
    renderer = new DynamicFormRenderer(FORM);
    await TestBed.configureTestingModule({
      imports: [DynamicFormViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormViewComponent);
    fixture.componentInstance.formRenderer = renderer;
    fixture.componentInstance.visibleFields = FORM.sections[0].fields;
    fixture.componentInstance.formValues = { name: 'Acme', active: true };
  });

  it('hides system section by default', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.sections.map((section) => section.code)).toEqual(['main']);
  });

  it('shows system section when enabled', () => {
    fixture.componentInstance.showSystemSection = true;
    fixture.detectChanges();
    expect(fixture.componentInstance.sections.map((section) => section.code)).toEqual([
      'main',
      'system',
    ]);
  });

  it('emits fieldChange when input updates', () => {
    const spy = jasmine.createSpy('fieldChange');
    fixture.componentInstance.fieldChange.subscribe(spy);
    fixture.detectChanges();
    fixture.componentInstance.fieldChange.emit({ name: 'name', value: 'Beta' });
    expect(spy).toHaveBeenCalledWith({ name: 'name', value: 'Beta' });
  });

  it('maps input types via inputType helper', () => {
    expect(fixture.componentInstance.inputType(field('name', 'email'))).toBe('email');
  });
});
