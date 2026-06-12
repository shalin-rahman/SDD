import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Assistant</h2>
    <p *ngIf="!aiEnabled">AI disabled in platform config.</p>
    <ng-container *ngIf="aiEnabled">
      <textarea [(ngModel)]="input" name="input"></textarea>
      <button type="button" (click)="chat()">Chat</button>
      <button type="button" (click)="summarize()">Summarize</button>
      <pre>{{ output }}</pre>
    </ng-container>
  `,
})
export class AssistantComponent implements OnInit {
  private readonly api = inject(EmcapApiService);

  aiEnabled = false;
  input = 'Summarize inventory status';
  output = '';

  ngOnInit(): void {
    void this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const config = await this.api.client.getPlatformConfig();
      const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
      this.aiEnabled = modules?.ai?.enabled === true;
    } catch {
      this.aiEnabled = false;
    }
  }

  chat(): void {
    void this.api.client.aiChat(this.input).then((r) => {
      this.output = JSON.stringify(r, null, 2);
    });
  }

  summarize(): void {
    void this.api.client.aiSummarize(this.input).then((r) => {
      this.output = JSON.stringify(r, null, 2);
    });
  }
}
