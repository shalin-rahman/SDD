import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { DashboardsComponent } from './dashboards.component';

describe('DashboardsComponent', () => {
  let fixture: ComponentFixture<DashboardsComponent>;
  let listDashboards: jasmine.Spy;

  beforeEach(async () => {
    listDashboards = jasmine.createSpy('listDashboards').and.resolveTo({ dashboards: [] });
    await TestBed.configureTestingModule({
      imports: [DashboardsComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: { listDashboards },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardsComponent);
  });

  it('renders empty state when no dashboards', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listDashboards).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No dashboards configured');
  });
});
