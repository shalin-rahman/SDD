import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDetailLayoutComponent } from './master-detail-layout.component';

describe('MasterDetailLayoutComponent', () => {
  let fixture: ComponentFixture<MasterDetailLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDetailLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterDetailLayoutComponent);
  });

  it('projects list and detail panes', () => {
    fixture.componentInstance.detailOpen = false;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.master-detail') as HTMLElement;
    expect(root.classList.contains('master-detail--detail-open')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.master-detail__list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.master-detail__detail')).toBeTruthy();
  });

  it('applies detail-open class when detail pane is active', () => {
    fixture.componentInstance.detailOpen = true;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.master-detail') as HTMLElement;
    expect(root.classList.contains('master-detail--detail-open')).toBeTrue();
  });
});
