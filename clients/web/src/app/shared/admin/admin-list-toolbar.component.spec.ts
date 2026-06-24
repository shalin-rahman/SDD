import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminListToolbarComponent } from './admin-list-toolbar.component';

describe('AdminListToolbarComponent', () => {
  let fixture: ComponentFixture<AdminListToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListToolbarComponent);
  });

  it('renders new button with custom label and emits create', () => {
    fixture.componentInstance.newLabel = 'Add user';
    fixture.detectChanges();

    const emitted: void[] = [];
    fixture.componentInstance.create.subscribe(() => emitted.push());

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Add user');
    btn.click();
    expect(emitted.length).toBe(1);
  });

  it('hides new button when showNew is false', () => {
    fixture.componentInstance.showNew = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
