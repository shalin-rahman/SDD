import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { PageHeaderComponent } from '../layout/page-header.component';
import { I18nService } from '../services/i18n.service';
import {
  DEFAULT_EMCAP_PRIMARY,
  formatContrastRatio,
  hasAdequatePrimaryContrast,
  previewPrimaryColor,
  primaryOnWhiteContrast,
} from '../utils/branding.util';

@Component({
  selector: 'app-branding-preview-panel',
  standalone: true,
  imports: [MatButtonModule, PageHeaderComponent],
  templateUrl: './branding-preview-panel.component.html',
  styleUrl: './branding-preview-panel.component.scss',
})
export class BrandingPreviewPanelComponent {
  private readonly i18n = inject(I18nService);

  @Input() primaryColor = DEFAULT_EMCAP_PRIMARY;
  @Input() logoUrl = '';
  @Input() title = 'Preview';
  @Input() subtitle = '';
  @Input() sampleActionLabel = 'Sample action';

  resolvedPrimary(): string {
    return previewPrimaryColor(this.primaryColor);
  }

  contrastAdequate(): boolean {
    return hasAdequatePrimaryContrast(this.primaryColor);
  }

  contrastRatioLabel(): string {
    return formatContrastRatio(primaryOnWhiteContrast(this.primaryColor));
  }

  contrastHint(): string {
    return `${this.i18n.t('settings.branding.contrastWarning')} (${this.contrastRatioLabel()}:1)`;
  }
}
