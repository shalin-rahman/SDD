import { Component, effect, inject, Input } from '@angular/core';

import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-detail-placeholder',
  standalone: true,
  template: `
    <div class="detail-placeholder">
      <p>{{ message || i18n.t('entity.selectPlaceholder') }}</p>
    </div>
  `,
  styles: [
    `
      .detail-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 320px;
        color: #666;
        padding: 1rem;
        text-align: center;
      }
    `,
  ],
})
export class DetailPlaceholderComponent {
  readonly i18n = inject(I18nService);
  @Input() message = '';
}
