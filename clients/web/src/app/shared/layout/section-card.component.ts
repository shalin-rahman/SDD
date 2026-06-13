import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-card',
  standalone: true,
  template: `
    <section class="section-card">
      @if (title) {
        <h3>{{ title }}</h3>
      }
      <ng-content />
    </section>
  `,
  styleUrl: './section-card.component.scss',
})
export class SectionCardComponent {
  @Input() title = '';
}
