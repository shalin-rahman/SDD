import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PageBreadcrumb {
  label: string;
  routerLink?: string | string[];
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumbs: PageBreadcrumb[] = [];
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();
}
