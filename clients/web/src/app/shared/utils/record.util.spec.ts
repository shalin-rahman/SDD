import { inputType, recordId } from './record.util';
import type { FormFieldMetadata } from '../../metadata/contract';

describe('record.util', () => {
  it('recordId stringifies id', () => {
    expect(recordId({ id: 'abc-123' })).toBe('abc-123');
    expect(recordId({})).toBe('');
  });

  it('inputType maps metadata field types', () => {
    const asType = (field_type: FormFieldMetadata['field_type']) =>
      inputType({ name: 'x', field_type } as FormFieldMetadata);

    expect(inputType({ name: 'x' } as FormFieldMetadata)).toBe('text');
    expect(asType('number')).toBe('number');
    expect(asType('date')).toBe('date');
    expect(asType('email')).toBe('email');
  });
});
