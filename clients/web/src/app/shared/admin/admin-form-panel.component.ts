import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-form-panel',
  standalone: true,
  templateUrl: './admin-form-panel.component.html',
  styleUrl: './admin-form-panel.component.scss',
})
export class AdminFormPanelComponent {
  @Input() title = 'Details';
  @Input() subtitle = '';
}
