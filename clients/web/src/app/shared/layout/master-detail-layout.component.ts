import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-master-detail-layout',
  standalone: true,
  templateUrl: './master-detail-layout.component.html',
  styleUrl: './master-detail-layout.component.scss',
})
export class MasterDetailLayoutComponent {
  @Input() detailOpen = false;
}
