import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { SettingsToggleGroupComponent } from './settings-toggle-group.component';

describe('SettingsToggleGroupComponent', () => {
  let fixture: ComponentFixture<SettingsToggleGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsToggleGroupComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsToggleGroupComponent);
    fixture.componentInstance.items = [
      { key: 'workflow', label: 'Workflow', checked: true },
    ];
  });

  it('emits itemChange when checkbox toggles', () => {
    const spy = jasmine.createSpy('itemChange');
    fixture.componentInstance.itemChange.subscribe(spy);
    fixture.componentInstance.onChange(
      { key: 'workflow', label: 'Workflow', checked: true },
      { checked: false } as MatCheckboxChange,
    );
    expect(spy).toHaveBeenCalledWith({ key: 'workflow', checked: false });
  });
});
