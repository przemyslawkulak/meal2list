import { Directive, ElementRef, HostListener, OnDestroy, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[appLongPressTooltip]',
  standalone: true,
})
export class LongPressTooltipDirective implements OnDestroy {
  tooltip = input<MatTooltip | undefined>();
  private touchTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  constructor(private el: ElementRef) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart() {
    if (!this.isTouch || !this.tooltip()) return;
    this.clearTimeout();
    this.touchTimeout = setTimeout(() => {
      this.tooltip()?.show();
    }, 1000);
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  onTouchEnd() {
    this.clearTimeout();
  }

  private clearTimeout() {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }
}
