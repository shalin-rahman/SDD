import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { EmptyStateComponent } from '../layout/empty-state.component';
import { SectionCardComponent } from '../layout/section-card.component';

export interface ChildLineColumn {
  header: string;
  align?: 'left' | 'right';
  cell: (line: Record<string, unknown>) => string;
}

export interface ChildLinesFooter {
  label: string;
  cells: string[];
}

/** Config-driven inline child lines table — PO/SO/STOCK_MOVEMENT parity (P25-T07). */
export interface ChildLinesConfig {
  parentCode: string;
  childCode: string;
  parentIdField: string;
  addRouteQueryParam: string;
  canAdd: (record: Record<string, unknown>) => boolean;
}

@Component({
  selector: 'app-child-lines-section',
  standalone: true,
  imports: [MatButtonModule, SectionCardComponent, EmptyStateComponent],
  template: `
    <app-section-card [title]="title">
      <div class="child-lines">
        @if (canAdd) {
          <div class="child-lines__toolbar">
            <button
              mat-stroked-button
              type="button"
              [attr.aria-label]="addLabel"
              (click)="addLine.emit()"
            >
              {{ addLabel }}
            </button>
          </div>
        }
        @if (error) {
          <p class="child-lines__error">{{ error }}</p>
        } @else if (!lines.length) {
          <app-empty-state
            [message]="emptyMessage"
            [actionLabel]="canAdd ? addLabel : ''"
            (action)="addLine.emit()"
          />
        } @else {
          <table class="child-lines__table">
            <thead>
              <tr>
                @for (col of columns; track col.header) {
                  <th [class.child-lines__num]="col.align === 'right'">{{ col.header }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (line of lines; track line['id']) {
                <tr>
                  @for (col of columns; track col.header) {
                    <td [class.child-lines__num]="col.align === 'right'">{{ col.cell(line) }}</td>
                  }
                </tr>
              }
            </tbody>
            @if (footer) {
              <tfoot>
                <tr>
                  <th>{{ footer.label }}</th>
                  @for (cell of footer.cells; track $index) {
                    <td [class.child-lines__num]="$index > 0">{{ cell }}</td>
                  }
                </tr>
              </tfoot>
            }
          </table>
        }
      </div>
    </app-section-card>
  `,
  styleUrl: './child-lines-section.component.scss',
})
export class ChildLinesSectionComponent {
  @Input() title = '';
  @Input() lines: Record<string, unknown>[] = [];
  @Input() error = '';
  @Input() canAdd = false;
  @Input() emptyMessage = '';
  @Input() addLabel = '';
  @Input() columns: ChildLineColumn[] = [];
  @Input() footer: ChildLinesFooter | null = null;

  @Output() addLine = new EventEmitter<void>();
}
