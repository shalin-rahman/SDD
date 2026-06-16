import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PermissionPickerComponent } from './permission-picker.component';

describe('PermissionPickerComponent', () => {
  let fixture: ComponentFixture<PermissionPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionPickerComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(PermissionPickerComponent);
    fixture.componentInstance.permissions = ['customer.read', 'customer.write', 'admin.users.read'];
    fixture.componentInstance.selected = ['customer.read'];
    fixture.detectChanges();
  });

  it('groups permissions by module', () => {
    expect(fixture.componentInstance.groups().length).toBeGreaterThan(0);
    expect(fixture.componentInstance.isChecked('customer.read')).toBeTrue();
    expect(fixture.componentInstance.isChecked('customer.write')).toBeFalse();
  });

  it('emits selectedChange on toggle', () => {
    const spy = jasmine.createSpy('selectedChange');
    fixture.componentInstance.selectedChange.subscribe(spy);
    fixture.componentInstance.onToggle('customer.write', true);
    expect(spy).toHaveBeenCalledWith(['customer.read', 'customer.write']);
  });

  it('toggles module wildcard', () => {
    const spy = jasmine.createSpy('selectedChange');
    fixture.componentInstance.selectedChange.subscribe(spy);
    fixture.componentInstance.onWildcard('customer', true);
    expect(spy).toHaveBeenCalledWith(['customer.*']);
    expect(fixture.componentInstance.wildcardChecked('customer')).toBeTrue();
  });
});
