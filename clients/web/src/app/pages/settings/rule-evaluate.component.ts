import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { EmcapApiService } from '../../services/emcap-api.service';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-rule-evaluate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  templateUrl: './rule-evaluate.component.html',
  styleUrl: './rule-evaluate.component.scss',
})
export class RuleEvaluateComponent {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  expression = 'amount > 100';
  contextJson = '{\n  "amount": 150\n}';
  evaluating = false;
  evaluateError = '';
  resultText = '';

  async evaluate(): Promise<void> {
    this.evaluateError = '';
    this.resultText = '';
    const expression = this.expression.trim();
    if (!expression) {
      this.evaluateError = this.i18n.t('settings.rules.evaluate.expressionRequired');
      return;
    }

    let context: Record<string, unknown> = {};
    const rawContext = this.contextJson.trim();
    if (rawContext) {
      try {
        const parsed = JSON.parse(rawContext) as unknown;
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          this.evaluateError = this.i18n.t('settings.rules.evaluate.invalidContextJson');
          return;
        }
        context = parsed as Record<string, unknown>;
      } catch {
        this.evaluateError = this.i18n.t('settings.rules.evaluate.invalidContextJson');
        return;
      }
    }

    this.evaluating = true;
    try {
      const response = await this.api.client.evaluateWorkflowRule(expression, context);
      this.resultText = this.formatResult(response.result);
    } catch (err) {
      this.evaluateError =
        err instanceof Error ? err.message : this.i18n.t('settings.rules.evaluate.evaluateFailed');
    } finally {
      this.evaluating = false;
    }
  }

  private formatResult(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}
