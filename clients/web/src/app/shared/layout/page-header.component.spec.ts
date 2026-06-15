import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
  });

  it('renders breadcrumb trail when items provided', () => {
    fixture.componentInstance.title = 'Products';
    fixture.componentInstance.breadcrumbs = [
      { label: 'Records' },
      { label: 'Products' },
    ];
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-header__breadcrumbs')?.textContent).toContain('Records');
    expect(el.querySelector('.page-header__crumb--current')?.textContent).toContain('Products');
  });
});
