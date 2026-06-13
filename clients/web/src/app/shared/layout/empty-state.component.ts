import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="empty-state">
      <p>{{ message }}</p>
      @if (actionLabel) {
        <button type="button" mat-flat-button color="primary" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input({ required: true }) message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
