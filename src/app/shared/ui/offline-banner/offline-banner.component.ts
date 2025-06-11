import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OnlineStatusService } from '@app/shared/services/online-status.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss'],
})
export class OfflineBannerComponent implements OnInit {
  isOnline = signal(true);

  constructor(private onlineStatus: OnlineStatusService) {}

  ngOnInit(): void {
    this.onlineStatus.isOnline$.subscribe(status => this.isOnline.set(status));
  }
}
