import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { PageHeaderComponent } from '../layout/page-header.component';
import { DEFAULT_EMCAP_PRIMARY, previewPrimaryColor } from '../utils/branding.util';

@Component({
  selector: 'app-branding-preview-panel',
  standalone: true,
  imports: [MatButtonModule, PageHeaderComponent],
  templateUrl: './branding-preview-panel.component.html',
  styleUrl: './branding-preview-panel.component.scss',
})
export class BrandingPreviewPanelComponent {
  @Input() primaryColor = DEFAULT_EMCAP_PRIMARY;
  @Input() logoUrl = '';
  @Input() title = 'Preview';
  @Input() subtitle = '';
  @Input() sampleActionLabel = 'Sample action';

  resolvedPrimary(): string {
    return previewPrimaryColor(this.primaryColor);
  }
}
