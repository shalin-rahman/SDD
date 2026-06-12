import { Injectable, inject } from '@angular/core';

import { createClient, EmcapClient } from '../api/emcap-client';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EmcapApiService {
  private readonly auth = inject(AuthService);
  private readonly _client = createClient();

  get client(): EmcapClient {
    const token = this.auth.getToken();
    if (token) {
      this._client.setToken(token, this.auth.getTenantId());
    }
    return this._client;
  }
}
