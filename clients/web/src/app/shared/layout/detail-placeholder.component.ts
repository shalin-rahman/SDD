import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { I18nService } from '../services/i18n.service';
import { EmptyStateComponent } from './empty-state.component';

@Component({
  selector: 'app-detail-placeholder',
  standalone: true,
  imports: [MatButtonModule, EmptyStateComponent],
  template: `
  @if (showCreateAction) {
    <app-empty-state
      [message]="message || i18n.t('entity.selectPlaceholder')"
      [actionLabel]="i18n.t('entity.new')"
      (action)="createRecord.emit()"
    />
  } @else {
    <div class="detail-placeholder">
      <p>{{ message || i18n.t('entity.selectPlaceholder') }}</p>
    </div>
  }
  `,
  styleUrl: './detail-placeholder.component.scss',
})
export class DetailPlaceholderComponent {
  readonly i18n = inject(I18nService);
  @Input() message = '';
  @Input() showCreateAction = true;
  @Output() createRecord = new EventEmitter<void>();
}
