import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-panel',
  standalone: true,
  template: `
    <div class="loading-panel" [class.loading-panel--inline]="inline">
      @if (message) {
        <span>{{ message }}</span>
      }
    </div>
  `,
  styleUrl: './loading-panel.component.scss',
})
export class LoadingPanelComponent {
  @Input() message = '';
  @Input() inline = false;
}
