import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionCardComponent } from './section-card.component';

describe('SectionCardComponent', () => {
  let fixture: ComponentFixture<SectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionCardComponent);
  });

  it('renders title when provided', () => {
    fixture.componentInstance.title = 'Organization';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3')?.textContent?.trim()).toBe('Organization');
  });

  it('omits heading when title is empty', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3')).toBeNull();
    expect(fixture.nativeElement.querySelector('.section-card')).toBeTruthy();
  });
});
