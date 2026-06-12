import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ i18n.t('platform.account.title') }}</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <ng-container *ngIf="!error">
      <p>{{ healthLine }}</p>
      <h3>{{ i18n.t('platform.account.permissions') }} ({{ permissions.length }})</h3>
      <ul>
        <li *ngFor="let perm of permissions.slice(0, 30)">{{ perm }}</li>
      </ul>
      <h3>{{ i18n.t('platform.account.roles') }} ({{ roles.length }})</h3>
      <ul>
        <li *ngFor="let role of roles">{{ roleLabel(role) }}</li>
      </ul>
      <h3>{{ i18n.t('platform.account.mfa') }}</h3>
      <button type="button" (click)="enrollMfa()">{{ i18n.t('platform.account.enrollMfa') }}</button>
      <button type="button" (click)="verifyMfa()">{{ i18n.t('platform.account.verifyMfa') }}</button>
      <input [(ngModel)]="mfaCode" name="mfaCode" [placeholder]="i18n.t('platform.account.totpCode')" />
      <p>{{ mfaSecret }}</p>
      <p *ngIf="mfaVerified">{{ i18n.t('platform.account.mfaVerified') }}</p>
      <h3>{{ i18n.t('account.integrations.title') }}</h3>
      <p class="settings-hint">{{ i18n.t('account.integrations.hint') }}</p>
      <input [(ngModel)]="dispatchUrl" name="dispatchUrl" />
      <textarea [(ngModel)]="dispatchPayload" name="dispatchPayload"></textarea>
      <button type="button" (click)="dispatchRest()">{{ i18n.t('platform.account.restDispatch') }}</button>
      <input [(ngModel)]="kafkaTopic" name="kafkaTopic" />
      <button type="button" (click)="publishKafka()">{{ i18n.t('platform.account.kafkaPublish') }}</button>
      <input [(ngModel)]="soapEndpoint" name="soapEndpoint" />
      <input [(ngModel)]="soapAction" name="soapAction" />
      <button type="button" (click)="invokeSoap()">{{ i18n.t('platform.account.soapInvoke') }}</button>
      <input [(ngModel)]="sftpHost" name="sftpHost" />
      <input [(ngModel)]="sftpPath" name="sftpPath" />
      <button type="button" (click)="uploadSftp()">{{ i18n.t('platform.account.sftpUpload') }}</button>
      <button type="button" (click)="graphqlHealth()">{{ i18n.t('platform.account.graphqlHealth') }}</button>
      <p>{{ graphqlResult }}</p>
      <h3>{{ i18n.t('platform.account.admin') }}</h3>
      <p>{{ meLine }}</p>
      <input [(ngModel)]="roleUser" name="roleUser" />
      <input [(ngModel)]="roleCode" name="roleCode" />
      <button type="button" (click)="assignRole()">{{ i18n.t('platform.account.assignRole') }}</button>
      <input [(ngModel)]="permCheck" name="permCheck" />
      <button type="button" (click)="checkPermission()">{{ i18n.t('platform.account.checkPermission') }}</button>
      <p>{{ permResult }}</p>
      <input [(ngModel)]="ruleExpr" name="ruleExpr" />
      <button type="button" (click)="evaluateRule()">{{ i18n.t('platform.account.evaluateRule') }}</button>
      <p>{{ ruleResult }}</p>
      <button type="button" (click)="fetchMetrics()">{{ i18n.t('platform.account.fetchMetrics') }}</button>
      <pre>{{ metricsPreview }}</pre>
      <p>{{ entitiesLine }}</p>
      <button *ngIf="paymentsEnabled" type="button" (click)="createPayment()">
        {{ i18n.t('platform.account.createPayment') }}
      </button>
      <p *ngIf="!paymentsEnabled">{{ i18n.t('platform.account.paymentsDisabled') }}</p>
      <p>{{ paymentResult }}</p>
      <p>{{ paymentConfirmed }}</p>
    </ng-container>
  `,
})
export class AccountComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  error = '';
  healthLine = '';
  permissions: string[] = [];
  roles: Record<string, unknown>[] = [];
  mfaCode = '';
  mfaSecret = '';
  mfaVerified = false;
  dispatchUrl = 'https://httpbin.org/post';
  dispatchPayload = '{"ping":true}';
  kafkaTopic = 'emcap.events';
  soapEndpoint = 'https://example.com/soap';
  soapAction = 'Ping';
  sftpHost = 'sftp.example.com';
  sftpPath = '/inbound/data.json';
  graphqlResult = '';
  meLine = '';
  roleUser = 'admin';
  roleCode = 'admin';
  permCheck = 'inventory.access';
  permResult = '';
  ruleExpr = 'amount > 100';
  ruleResult = '';
  metricsPreview = '';
  entitiesLine = '';
  paymentsEnabled = false;
  paymentResult = '';
  paymentConfirmed = '';

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error = '';
    try {
      const [health, tenants, permissionsPayload, rolesPayload, config] = await Promise.all([
        this.api.client.getHealth(),
        this.api.client.listTenants(),
        this.api.client.getPermissions(),
        this.api.client.getRoles(),
        this.api.client.getPlatformConfig(),
      ]);
      this.healthLine = `${this.i18n.t('platform.account.multiTenant')}: ${String(health.multi_tenant)} · ${this.i18n.t('platform.account.whiteLabel')}: ${String(tenants.white_label)}`;
      this.permissions = permissionsPayload.permissions;
      this.roles = rolesPayload.roles;
      const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
      this.paymentsEnabled = modules?.payments?.enabled === true;
      void this.api.client.getMe().then((me) => {
        this.meLine = `${this.i18n.t('platform.account.user')}: ${String(me.user_id ?? me)}`;
      });
      void this.api.client.listEntities().then((r) => {
        this.entitiesLine = `${this.i18n.t('platform.account.entities')}: ${r.entities.join(', ')}`;
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.account.loadFailed');
    }
  }

  roleLabel(role: Record<string, unknown>): string {
    return String(role.code ?? role.name ?? role);
  }

  enrollMfa(): void {
    void this.api.client.enrollMfa().then((r) => {
      this.mfaSecret = `${this.i18n.t('platform.account.mfaSecret')}: ${r.secret}`;
    });
  }

  verifyMfa(): void {
    void this.api.client.verifyMfa(this.mfaCode).then((r) => {
      this.auth.setSession(r.access_token, this.auth.getTenantId());
      this.mfaVerified = true;
    });
  }

  dispatchRest(): void {
    void this.api.client.dispatchRestIntegration(
      this.dispatchUrl,
      JSON.parse(this.dispatchPayload) as Record<string, unknown>,
    );
  }

  publishKafka(): void {
    void this.api.client.publishKafkaIntegration(this.kafkaTopic, { ping: true });
  }

  invokeSoap(): void {
    void this.api.client.invokeSoapIntegration(this.soapEndpoint, this.soapAction, {});
  }

  uploadSftp(): void {
    void this.api.client.uploadSftpIntegration(this.sftpHost, this.sftpPath, { ok: true });
  }

  graphqlHealth(): void {
    void this.api.client.graphqlQuery('{ health { status multi_tenant } }').then((r) => {
      this.graphqlResult = `GraphQL: ${JSON.stringify(r)}`;
    });
  }

  assignRole(): void {
    void this.api.client.assignRole(this.roleUser, this.roleCode);
  }

  checkPermission(): void {
    void this.api.client.checkAuth(this.permCheck).then((r) => {
      this.permResult = `${this.i18n.t('platform.account.allowed')}: ${String(r.allowed)}`;
    });
  }

  evaluateRule(): void {
    void this.api.client.evaluateWorkflowRule(this.ruleExpr, { amount: 150 }).then((r) => {
      this.ruleResult = `${this.i18n.t('platform.account.ruleResult')}: ${String(r.result)}`;
    });
  }

  fetchMetrics(): void {
    void this.api.client.getMetrics().then((text) => {
      this.metricsPreview = text.slice(0, 500);
    });
  }

  createPayment(): void {
    void this.api.client.createPaymentIntent('10.00').then((result) => {
      this.paymentResult = `Intent: ${JSON.stringify(result)}`;
      const txnId = String(result.transaction_id ?? '');
      if (txnId) {
        void this.api.client.confirmPaymentIntent(txnId).then((confirmed) => {
          this.paymentConfirmed = `${this.i18n.t('platform.account.paymentConfirmed')}: ${JSON.stringify(confirmed)}`;
        });
      }
    });
  }
}
