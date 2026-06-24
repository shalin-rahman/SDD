import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentInstance.message = 'Nothing here yet';
  });

  it('renders message without action when actionLabel is empty', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nothing here yet');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('renders action button and emits on click', () => {
    fixture.componentInstance.actionLabel = 'Create one';
    fixture.detectChanges();

    const emitted: void[] = [];
    fixture.componentInstance.action.subscribe(() => emitted.push());

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Create one');
    btn.click();
    expect(emitted.length).toBe(1);
  });
});
