import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { map, shareReplay } from 'rxjs';

import { MOBILE_BREAKPOINT } from '../constants/layout.constants';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly breakpoints = inject(BreakpointObserver);

  readonly isMobile$ = this.breakpoints.observe([MOBILE_BREAKPOINT]).pipe(
    map((state) => state.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
