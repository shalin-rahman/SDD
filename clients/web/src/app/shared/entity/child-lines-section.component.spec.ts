import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ChildLineColumn,
  ChildLinesFooter,
  ChildLinesSectionComponent,
} from './child-lines-section.component';

describe('ChildLinesSectionComponent', () => {
  let fixture: ComponentFixture<ChildLinesSectionComponent>;

  const columns: ChildLineColumn[] = [
    { header: 'Product', cell: (line) => String(line['product_id'] ?? '—') },
    { header: 'Qty', align: 'right', cell: (line) => String(line['quantity'] ?? 0) },
    { header: 'Total', align: 'right', cell: () => '$10.00' },
  ];

  const footer: ChildLinesFooter = {
    label: 'Totals',
    cells: ['2', '', '$10.00'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildLinesSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildLinesSectionComponent);
    fixture.componentRef.setInput('title', 'Order lines');
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('emptyMessage', 'No lines yet.');
    fixture.componentRef.setInput('addLabel', 'Add line');
  });

  it('renders empty state with add action when canAdd', () => {
    fixture.componentRef.setInput('canAdd', true);
    fixture.componentRef.setInput('lines', []);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('No lines yet.');
    expect(text).toContain('Add line');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('renders table rows, numeric alignment, and footer', () => {
    fixture.componentRef.setInput('lines', [
      { id: 'l1', product_id: 'prod-1', quantity: 2 },
    ]);
    fixture.componentRef.setInput('footer', footer);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('prod-1');
    expect(text).toContain('Totals');
    expect(text).toContain('$10.00');
    expect(fixture.nativeElement.querySelector('.child-lines__num')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.child-lines__table')).toBeTruthy();
  });

  it('shows error message and emits addLine from toolbar', () => {
    const addLine = jasmine.createSpy('addLine');
    fixture.componentInstance.addLine.subscribe(addLine);

    fixture.componentRef.setInput('canAdd', true);
    fixture.componentRef.setInput('error', 'Load failed');
    fixture.componentRef.setInput('lines', [{ id: 'l1' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Load failed');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(addLine).toHaveBeenCalled();
  });

  it('hides add toolbar when canAdd is false and omits footer when unset', () => {
    fixture.componentRef.setInput('canAdd', false);
    fixture.componentRef.setInput('lines', [{ id: 'l1', product_id: 'p1', quantity: 1 }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.child-lines__toolbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('tfoot')).toBeNull();
  });

  it('emits addLine from empty-state action when canAdd', () => {
    const addLine = jasmine.createSpy('addLine');
    fixture.componentInstance.addLine.subscribe(addLine);

    fixture.componentRef.setInput('canAdd', true);
    fixture.componentRef.setInput('lines', []);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('app-empty-state button') as HTMLButtonElement;
    btn.click();
    expect(addLine).toHaveBeenCalled();
  });
});
