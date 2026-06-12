/**
 * EMCAP platform HTTP client — SDD §9 presentation layer integration.
 */

import type { FormMetadata, GridMetadata } from '../metadata/contract';

export interface LoginResult {
  access_token: string;
  user_id: string;
  tenant_id: string;
}

export interface MenuItem {
  code: string;
  label: string;
  entity_code: string;
  module: string;
  permission?: string;
}

export interface MaskedSecretView {
  masked: string;
  configured: boolean;
}

export interface AdminSettingsResponse {
  settings: Record<string, unknown>;
  editable_paths: string[];
  write_only_paths?: string[];
}

export interface AdminIntegrationsResponse {
  integrations: Record<string, unknown>;
  editable_paths: string[];
  write_only_paths?: string[];
}

export interface SecurityPolicyField {
  name: string;
  read_roles: string[];
  access: string;
}

export interface SecurityPolicyEntity {
  code: string;
  read_permission: string;
  row_access: string;
  fields: SecurityPolicyField[];
}

export interface AdminSecurityPoliciesResponse {
  entities: SecurityPolicyEntity[];
  rules: Record<string, string>;
}

export interface AbacPolicyRow {
  permission: string;
  effect: string;
  attribute: string;
  operator: string;
  value: string;
}

export interface AdminAbacPoliciesResponse {
  policies: AbacPolicyRow[];
}

export interface ReportSummary {
  code: string;
  name: string;
  entity_code: string;
  schedule_cron: string | null;
}

export class EmcapClient {
  constructor(private readonly baseUrl: string) {}

  private token: string | null = null;
  private tenantId = 'default';

  setToken(token: string, tenantId: string): void {
    this.token = token;
    this.tenantId = tenantId;
  }

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers as Record<string, string>) },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`${response.status}: ${detail}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  login(username: string, password: string): Promise<LoginResult> {
    return this.request<LoginResult>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  getMenus(): Promise<{ menus: MenuItem[] }> {
    return this.request('/api/v1/menus');
  }

  getFormMetadata(entityCode: string): Promise<FormMetadata> {
    return this.request(`/api/v1/metadata/forms/${entityCode}`);
  }

  getGridMetadata(entityCode: string): Promise<GridMetadata> {
    return this.request(`/api/v1/metadata/grids/${entityCode}`);
  }

  listRecords(
    entityCode: string,
    options?: { q?: string },
  ): Promise<{ records: Record<string, unknown>[] }> {
    const params = new URLSearchParams();
    if (options?.q) {
      params.set('q', options.q);
    }
    const query = params.toString();
    return this.request(`/api/v1/entities/${entityCode}/records${query ? `?${query}` : ''}`);
  }

  getAuthProviders(): Promise<{ providers: string[] }> {
    return this.request('/api/v1/auth/providers');
  }

  loginOAuth(clientId: string, clientSecret: string): Promise<LoginResult> {
    return this.request<LoginResult>('/api/v1/auth/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  }

  enrollMfa(): Promise<{ secret: string }> {
    return this.request('/api/v1/auth/mfa/enroll', { method: 'POST' });
  }

  verifyMfa(code: string): Promise<{ access_token: string }> {
    return this.request('/api/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  startWorkflow(
    workflowCode: string,
    recordId: string,
    assignee = 'admin',
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/workflows/${workflowCode}/start`, {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, assignee }),
    });
  }

  listReportRuns(reportCode: string): Promise<{ runs: Record<string, unknown>[] }> {
    return this.request(`/api/v1/reports/${reportCode}/runs`);
  }

  getDocument(documentId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/documents/${documentId}`);
  }

  aiChat(message: string): Promise<Record<string, unknown>> {
    return this.request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  aiSummarize(text: string): Promise<Record<string, unknown>> {
    return this.request('/api/v1/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  getRecord(entityCode: string, recordId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`);
  }

  createRecord(
    entityCode: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateRecord(
    entityCode: string,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteRecord(entityCode: string, recordId: string): Promise<void> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`, {
      method: 'DELETE',
    });
  }

  syncSnapshot(entityCode: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/sync/${entityCode}/snapshot`);
  }

  listNotes(entityCode: string, recordId: string): Promise<{ notes: Record<string, unknown>[] }> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}/notes`);
  }

  addNote(entityCode: string, recordId: string, body: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  listWorkflowInstances(recordId?: string): Promise<{ instances: Record<string, unknown>[] }> {
    const query = recordId ? `?record_id=${encodeURIComponent(recordId)}` : '';
    return this.request(`/api/v1/workflows/instances${query}`);
  }

  getWorkflowInstance(instanceId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/workflows/instances/${instanceId}`);
  }

  transitionWorkflow(
    instanceId: string,
    action: string,
    actor: string,
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/workflows/instances/${instanceId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ action, actor }),
    });
  }

  delegateWorkflow(instanceId: string, delegateTo: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/workflows/instances/${instanceId}/delegate`, {
      method: 'POST',
      body: JSON.stringify({ delegate_to: delegateTo }),
    });
  }

  uploadDocument(
    entityCode: string,
    recordId: string,
    filename: string,
    content: string,
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ entity_code: entityCode, record_id: recordId, filename, content }),
    });
  }

  listAudit(entityCode: string): Promise<{ entity: string; audit: Record<string, unknown>[] }> {
    return this.request(`/api/v1/entities/${entityCode}/audit`);
  }

  listNotifications(): Promise<{ notifications: Record<string, unknown>[] }> {
    return this.request('/api/v1/notifications');
  }

  sendNotification(payload: {
    channel: string;
    recipient: string;
    subject: string;
    body: string;
  }): Promise<Record<string, unknown>> {
    return this.request('/api/v1/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getPermissions(): Promise<{ permissions: string[] }> {
    return this.request('/api/v1/permissions');
  }

  getRoles(): Promise<{ roles: Record<string, unknown>[] }> {
    return this.request('/api/v1/auth/roles');
  }

  listDashboards(): Promise<{ dashboards: Record<string, unknown>[] }> {
    return this.request('/api/v1/dashboards');
  }

  getHealth(): Promise<{ status: string; multi_tenant: boolean; tenant_strategy: string }> {
    return this.request('/api/v1/health');
  }

  getPlatformConfig(): Promise<Record<string, unknown>> {
    return this.request('/api/v1/config/platform');
  }

  listTenants(): Promise<{
    multi_tenant: boolean;
    white_label: boolean;
    strategy: string;
    tenants: Record<string, unknown>[];
  }> {
    return this.request('/api/v1/tenants');
  }

  createPaymentIntent(amount: string, currency = 'USD'): Promise<Record<string, unknown>> {
    return this.request('/api/v1/payments/intents', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  }

  dispatchRestIntegration(
    url: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/integrations/rest/dispatch', {
      method: 'POST',
      body: JSON.stringify({ url, payload }),
    });
  }

  publishKafkaIntegration(
    topic: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/integrations/kafka/publish', {
      method: 'POST',
      body: JSON.stringify({ topic, payload }),
    });
  }

  invokeSoapIntegration(
    endpoint: string,
    action: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/integrations/soap/invoke', {
      method: 'POST',
      body: JSON.stringify({ endpoint, action, payload }),
    });
  }

  uploadSftpIntegration(
    host: string,
    path: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/integrations/sftp/upload', {
      method: 'POST',
      body: JSON.stringify({ host, path, payload }),
    });
  }

  graphqlQuery(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.request('/api/v1/graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
  }

  getMe(): Promise<Record<string, unknown>> {
    return this.request('/api/v1/auth/me');
  }

  assignRole(userId: string, roleCode: string): Promise<{ status: string }> {
    return this.request('/api/v1/auth/roles/assign', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role_code: roleCode }),
    });
  }

  checkAuth(permission: string, tenantId?: string): Promise<{ allowed: boolean }> {
    return this.request('/api/v1/auth/check', {
      method: 'POST',
      body: JSON.stringify({ permission, tenant_id: tenantId ?? this.tenantId }),
    });
  }

  escalateWorkflows(): Promise<{ escalated: number }> {
    return this.request('/api/v1/workflows/escalate', { method: 'POST' });
  }

  evaluateWorkflowRule(
    expression: string,
    context: Record<string, unknown>,
  ): Promise<{ result: unknown }> {
    return this.request('/api/v1/workflows/rules/evaluate', {
      method: 'POST',
      body: JSON.stringify({ expression, context }),
    });
  }

  listEntities(): Promise<{ entities: string[] }> {
    return this.request('/api/v1/entities');
  }

  getMetrics(): Promise<string> {
    return fetch(`${this.baseUrl}/api/v1/metrics`, { headers: this.headers() }).then((r) =>
      r.text(),
    );
  }

  confirmPaymentIntent(transactionId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/payments/intents/${transactionId}/confirm`, { method: 'POST' });
  }

  listAdminUsers(): Promise<{ users: Record<string, unknown>[] }> {
    return this.request('/api/v1/admin/users');
  }

  getAdminUser(userId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/admin/users/${userId}`);
  }

  createAdminUser(payload: {
    username: string;
    password: string;
    tenant_id?: string;
    role_codes?: string[];
    attributes?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    return this.request('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(payload) });
  }

  updateAdminUser(
    userId: string,
    payload: {
      tenant_id?: string;
      active?: boolean;
      attributes?: Record<string, unknown>;
      role_codes?: string[];
      password?: string;
    },
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deactivateAdminUser(userId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/admin/users/${userId}/deactivate`, { method: 'PATCH' });
  }

  listAdminRoles(): Promise<{ roles: Record<string, unknown>[] }> {
    return this.request('/api/v1/admin/roles');
  }

  createAdminRole(payload: {
    code: string;
    name: string;
    permissions: string[];
  }): Promise<Record<string, unknown>> {
    return this.request('/api/v1/admin/roles', { method: 'POST', body: JSON.stringify(payload) });
  }

  updateAdminRole(
    roleId: string,
    payload: { name?: string; permissions?: string[] },
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  getAdminSettings(): Promise<AdminSettingsResponse> {
    return this.request('/api/v1/admin/settings');
  }

  updateAdminSettings(settings: Record<string, unknown>): Promise<AdminSettingsResponse> {
    return this.request('/api/v1/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  getAdminIntegrations(): Promise<AdminIntegrationsResponse> {
    return this.request('/api/v1/admin/integrations');
  }

  updateAdminIntegrations(
    integrations: Record<string, unknown>,
  ): Promise<AdminIntegrationsResponse> {
    return this.request('/api/v1/admin/integrations', {
      method: 'PUT',
      body: JSON.stringify({ integrations }),
    });
  }

  testAdminRestIntegration(): Promise<Record<string, unknown>> {
    return this.request('/api/v1/admin/integrations/test-rest', { method: 'POST' });
  }

  getAdminSecurityPolicies(): Promise<AdminSecurityPoliciesResponse> {
    return this.request('/api/v1/admin/security/policies');
  }

  getAdminAbacPolicies(): Promise<AdminAbacPoliciesResponse> {
    return this.request('/api/v1/admin/security/abac');
  }

  updateAdminAbacPolicies(policies: AbacPolicyRow[]): Promise<AdminAbacPoliciesResponse> {
    return this.request('/api/v1/admin/security/abac', {
      method: 'PUT',
      body: JSON.stringify({ policies }),
    });
  }

  listAdminTemplates(): Promise<{ templates: Record<string, unknown>[] }> {
    return this.request('/api/v1/admin/templates');
  }

  createAdminTemplate(payload: {
    code: string;
    channel?: string;
    subject?: string;
    body?: string;
  }): Promise<Record<string, unknown>> {
    return this.request('/api/v1/admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateAdminTemplate(
    templateId: string,
    payload: { channel?: string; subject?: string; body?: string },
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/admin/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deleteAdminTemplate(templateId: string): Promise<void> {
    return this.request(`/api/v1/admin/templates/${templateId}`, { method: 'DELETE' });
  }

  getAdminAudit(): Promise<{ audit: Record<string, unknown>[] }> {
    return this.request('/api/v1/admin/audit');
  }

  listReports(): Promise<{ reports: ReportSummary[] }> {
    return this.request('/api/v1/reports');
  }

  runReport(reportCode: string): Promise<{ report_code: string; rows: Record<string, unknown>[] }> {
    return this.request(`/api/v1/reports/${reportCode}/run`, { method: 'POST' });
  }

  listDocuments(
    entityCode: string,
    recordId: string,
  ): Promise<{ documents: Record<string, unknown>[] }> {
    const params = new URLSearchParams({ entity_code: entityCode, record_id: recordId });
    return this.request(`/api/v1/documents?${params}`);
  }

  syncChanges(
    entityCode: string,
    since: string,
  ): Promise<{ count: number; records: Record<string, unknown>[] }> {
    const params = new URLSearchParams({ since });
    return this.request(`/api/v1/sync/${entityCode}/changes?${params}`);
  }

  subscribeRecordsStream(
    entityCode: string,
    onEvent: (payload: Record<string, unknown>) => void,
  ): () => void {
    const controller = new AbortController();
    const decoder = new TextDecoder();

    void (async () => {
      try {
        const response = await fetch(
          `${this.baseUrl}/api/v1/entities/${entityCode}/records/stream`,
          {
            headers: this.headers(),
            signal: controller.signal,
          },
        );
        if (!response.ok || !response.body) {
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              onEvent(JSON.parse(line.slice(6)) as Record<string, unknown>);
            }
          }
        }
      } catch {
        // stream closed
      }
    })();

    return () => controller.abort();
  }
}

export function createClient(baseUrl?: string): EmcapClient {
  let url = baseUrl;
  if (!url && typeof window !== 'undefined') {
    url = (window as unknown as { EMCAP_API_URL?: string }).EMCAP_API_URL;
  }
  return new EmcapClient(url ?? 'http://localhost:8000');
}
