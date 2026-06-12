import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'emcap-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');

  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    const mode: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    this.apply(mode);
  }

  toggle(): void {
    this.apply(this.mode() === 'light' ? 'dark' : 'light');
  }

  apply(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset['theme'] = mode;
    document.documentElement.style.colorScheme = mode;
  }
}
