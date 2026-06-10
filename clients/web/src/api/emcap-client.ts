/**
 * EMCAP platform HTTP client — SDD §9 presentation layer integration.
 */

import type { FormMetadata, GridMetadata } from "../metadata/contract";

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
}

export class EmcapClient {
  constructor(private readonly baseUrl: string) {}

  private token: string | null = null;
  private tenantId = "default";

  setToken(token: string, tenantId: string): void {
    this.token = token;
    this.tenantId = tenantId;
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-ID": this.tenantId,
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
    return this.request<LoginResult>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  getMenus(): Promise<{ menus: MenuItem[] }> {
    return this.request("/api/v1/menus");
  }

  getFormMetadata(entityCode: string): Promise<FormMetadata> {
    return this.request(`/api/v1/metadata/forms/${entityCode}`);
  }

  getGridMetadata(entityCode: string): Promise<GridMetadata> {
    return this.request(`/api/v1/metadata/grids/${entityCode}`);
  }

  listRecords(entityCode: string): Promise<{ records: Record<string, unknown>[] }> {
    return this.request(`/api/v1/entities/${entityCode}/records`);
  }

  getRecord(entityCode: string, recordId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`);
  }

  createRecord(entityCode: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateRecord(
    entityCode: string,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteRecord(entityCode: string, recordId: string): Promise<void> {
    return this.request(`/api/v1/entities/${entityCode}/records/${recordId}`, {
      method: "DELETE",
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
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  listWorkflowInstances(recordId?: string): Promise<{ instances: Record<string, unknown>[] }> {
    const query = recordId ? `?record_id=${encodeURIComponent(recordId)}` : "";
    return this.request(`/api/v1/workflows/instances${query}`);
  }
}

export function createClient(baseUrl?: string): EmcapClient {
  let url = baseUrl;
  if (!url && typeof window !== "undefined") {
    url = (window as unknown as { EMCAP_API_URL?: string }).EMCAP_API_URL;
  }
  return new EmcapClient(url ?? "http://localhost:8000");
}
