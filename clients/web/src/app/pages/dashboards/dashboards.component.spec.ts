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

  it('renders dashboard widgets when configured', async () => {
    listDashboards.and.resolveTo({
      dashboards: [
        {
          code: 'ops',
          name: 'Operations',
          widgets: [{ code: 'low_stock', label: 'Low stock', type: 'metric', value: 3 }],
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.dashboardName(cmp.dashboards[0])).toBe('Operations');
    expect(cmp.dashboardWidgets(cmp.dashboards[0]).length).toBe(1);
    expect(cmp.widgetTitle(cmp.dashboardWidgets(cmp.dashboards[0])[0])).toBe('Low stock');
  });

  it('handles load errors and widget/name fallbacks', async () => {
    listDashboards.and.rejectWith(new Error('dash down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('dash down');

    const cmp = fixture.componentInstance;
    expect(cmp.dashboardName({ code: 'ops' })).toBe('ops');
    expect(cmp.dashboardName({})).toBeTruthy();
    expect(cmp.dashboardCode({ code: 123 })).toBe('');
    expect(cmp.dashboardWidgets({})).toEqual([]);

    const widget = { code: 'metric_code', metric: '42', icon: 'trending_up', report_code: 'LOW_STOCK' };
    expect(cmp.widgetTitle(widget)).toBe('metric_code');
    expect(cmp.widgetValue(widget)).toBe('42');
    expect(cmp.widgetIcon(widget)).toBe('trending_up');
    expect(cmp.widgetReportCode(widget)).toBe('LOW_STOCK');
    expect(cmp.widgetValue({})).toBeTruthy();
    expect(cmp.widgetIcon({})).toBe('insights');
    expect(cmp.widgetReportCode({ report_code: '  ' })).toBeNull();
  });
});
