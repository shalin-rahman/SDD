import { Component, Input, inject } from '@angular/core';

import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-loading-panel',
  standalone: true,
  template: `
    <div
      class="loading-panel"
      [class.loading-panel--inline]="inline"
      role="status"
      aria-live="polite"
      [attr.aria-label]="i18n.t('a11y.screenReader.loading')"
    >
      @if (message) {
        <span>{{ message }}</span>
      }
    </div>
  `,
  styleUrl: './loading-panel.component.scss',
})
export class LoadingPanelComponent {
  readonly i18n = inject(I18nService);

  @Input() message = '';
  @Input() inline = false;
}
