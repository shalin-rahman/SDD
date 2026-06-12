import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Account</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <ng-container *ngIf="!error">
      <p>{{ healthLine }}</p>
      <h3>Permissions ({{ permissions.length }})</h3>
      <ul>
        <li *ngFor="let perm of permissions.slice(0, 30)">{{ perm }}</li>
      </ul>
      <h3>Roles ({{ roles.length }})</h3>
      <ul>
        <li *ngFor="let role of roles">{{ roleLabel(role) }}</li>
      </ul>
      <h3>MFA</h3>
      <button type="button" (click)="enrollMfa()">Enroll MFA</button>
      <button type="button" (click)="verifyMfa()">Verify MFA</button>
      <input [(ngModel)]="mfaCode" name="mfaCode" placeholder="TOTP code" />
      <p>{{ mfaSecret }}</p>
      <p *ngIf="mfaVerified">MFA verified — token refreshed</p>
      <h3>Integrations</h3>
      <input [(ngModel)]="dispatchUrl" name="dispatchUrl" />
      <textarea [(ngModel)]="dispatchPayload" name="dispatchPayload"></textarea>
      <button type="button" (click)="dispatchRest()">REST dispatch</button>
      <input [(ngModel)]="kafkaTopic" name="kafkaTopic" />
      <button type="button" (click)="publishKafka()">Kafka publish</button>
      <input [(ngModel)]="soapEndpoint" name="soapEndpoint" />
      <input [(ngModel)]="soapAction" name="soapAction" />
      <button type="button" (click)="invokeSoap()">SOAP invoke</button>
      <input [(ngModel)]="sftpHost" name="sftpHost" />
      <input [(ngModel)]="sftpPath" name="sftpPath" />
      <button type="button" (click)="uploadSftp()">SFTP upload</button>
      <button type="button" (click)="graphqlHealth()">GraphQL health</button>
      <p>{{ graphqlResult }}</p>
      <h3>Admin</h3>
      <p>{{ meLine }}</p>
      <input [(ngModel)]="roleUser" name="roleUser" />
      <input [(ngModel)]="roleCode" name="roleCode" />
      <button type="button" (click)="assignRole()">Assign role</button>
      <input [(ngModel)]="permCheck" name="permCheck" />
      <button type="button" (click)="checkPermission()">Check permission</button>
      <p>{{ permResult }}</p>
      <input [(ngModel)]="ruleExpr" name="ruleExpr" />
      <button type="button" (click)="evaluateRule()">Evaluate rule</button>
      <p>{{ ruleResult }}</p>
      <button type="button" (click)="fetchMetrics()">Fetch metrics</button>
      <pre>{{ metricsPreview }}</pre>
      <p>{{ entitiesLine }}</p>
      <button *ngIf="paymentsEnabled" type="button" (click)="createPayment()">
        Create payment intent (demo)
      </button>
      <p *ngIf="!paymentsEnabled">Payments disabled in platform config.</p>
      <p>{{ paymentResult }}</p>
      <p>{{ paymentConfirmed }}</p>
    </ng-container>
  `,
})
export class AccountComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  private readonly auth = inject(AuthService);

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
      this.healthLine = `Multi-tenant: ${String(health.multi_tenant)} · White-label: ${String(tenants.white_label)}`;
      this.permissions = permissionsPayload.permissions;
      this.roles = rolesPayload.roles;
      const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
      this.paymentsEnabled = modules?.payments?.enabled === true;
      void this.api.client.getMe().then((me) => {
        this.meLine = `User: ${String(me.user_id ?? me)}`;
      });
      void this.api.client.listEntities().then((r) => {
        this.entitiesLine = `Entities: ${r.entities.join(', ')}`;
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load account';
    }
  }

  roleLabel(role: Record<string, unknown>): string {
    return String(role.code ?? role.name ?? role);
  }

  enrollMfa(): void {
    void this.api.client.enrollMfa().then((r) => {
      this.mfaSecret = `Secret: ${r.secret}`;
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
      this.permResult = `Allowed: ${String(r.allowed)}`;
    });
  }

  evaluateRule(): void {
    void this.api.client.evaluateWorkflowRule(this.ruleExpr, { amount: 150 }).then((r) => {
      this.ruleResult = `Rule result: ${String(r.result)}`;
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
          this.paymentConfirmed = `Confirmed: ${JSON.stringify(confirmed)}`;
        });
      }
    });
  }
}
