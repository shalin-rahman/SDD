import { Injectable, signal } from '@angular/core';

import { DEFAULT_EMCAP_PRIMARY, normalizePrimaryColor } from '../utils/branding.util';

export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';

const STORAGE_KEY = 'emcap-theme';
const DENSITY_STORAGE_KEY = 'emcap-density';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');
  readonly density = signal<DensityMode>('comfortable');

  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    const mode: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    this.apply(mode);

    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY);
    const density: DensityMode = storedDensity === 'compact' ? 'compact' : 'comfortable';
    this.applyDensity(density);
  }

  toggle(): void {
    this.apply(this.mode() === 'light' ? 'dark' : 'light');
  }

  toggleDensity(): void {
    this.applyDensity(this.density() === 'comfortable' ? 'compact' : 'comfortable');
  }

  apply(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset['theme'] = mode;
    document.documentElement.style.colorScheme = mode;
  }

  applyDensity(mode: DensityMode): void {
    this.density.set(mode);
    localStorage.setItem(DENSITY_STORAGE_KEY, mode);
    document.documentElement.dataset['density'] = mode;
  }

  applyTenantPrimary(color: string | undefined | null): void {
    const resolved = normalizePrimaryColor(color) ?? DEFAULT_EMCAP_PRIMARY;
    document.documentElement.style.setProperty('--emcap-primary', resolved);
  }
}
