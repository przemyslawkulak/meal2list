import { Component, OnInit } from '@angular/core';
import { SupabaseService } from './core/supabase/supabase.service';
import { AuthSession } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'meal2list';
  session: AuthSession | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  ngOnInit() {
    this.supabase.authChanges((_, session) => {
      this.session = session;
    });
  }
}
