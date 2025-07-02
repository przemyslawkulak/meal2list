import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/supabase/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,

    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly _authService = inject(AuthService);

  readonly isAuthenticated$ = this._authService.isAuthenticated$;

  readonly features = [
    {
      icon: 'smart_toy',
      title: 'Generowanie przez AI',
      description:
        'Generuj spersonalizowane listy zakupów na podstawie swoich preferencji, ograniczeń dietetycznych i planów posiłków za pomocą zaawansowanej technologii AI.',
    },
    {
      icon: 'mobile_friendly',
      title: 'Zoptymalizowane na Mobilne',
      description:
        'Uzyskaj dostęp do swoich list w każdym miejscu i czasie. Nasz design mobile-first zapewnia doskonałe doświadczenie na wszystkich urządzeniach.',
    },
    {
      icon: 'checklist',
      title: 'Inteligentna Organizacja',
      description:
        'Automatycznie kategoryzuj artykuły, śledź co masz w domu i organizuj zakupy według układu sklepu dla maksymalnej efektywności.',
    },
    {
      icon: 'group',
      title: 'Dzielenie z Rodziną',
      description:
        'Udostępniaj listy członkom rodziny, współpracuj w czasie rzeczywistym i nigdy nie zapomnij o żadnym produkcie dzięki zsynchronizowanym aktualizacjom.',
      comingSoon: true,
    },
    {
      icon: 'savings',
      title: 'Śledzenie Budżetu',
      description:
        'Śledź swoje wydatki, ustalaj budżety dla różnych kategorii i podejmuj świadome decyzje o zakupach.',
      comingSoon: true,
    },
    {
      icon: 'restaurant_menu',
      title: 'Planowanie Posiłków',
      description:
        'Planuj posiłki na cały tydzień i automatycznie generuj listy zakupów ze wszystkimi potrzebnymi składnikami.',
      comingSoon: true,
    },
  ];

  readonly testimonials = [
    {
      name: 'Anna Kowalska',
      role: 'Zapracowana Mama 3 Dzieci',
      content:
        'Meal2List zrewolucjonizował sposób, w jaki robię zakupy spożywcze. Sugestie AI są trafne, a moja rodzina uwielbia różnorodność posiłków!',
      rating: 5,
    },
    {
      name: 'Michał Nowak',
      role: 'Szef Kuchni',
      content:
        'Jako szef kuchni doceniam, jak ta aplikacja rozumie składniki i sugeruje idealne kombinacje. To jak posiadanie commis w kieszeni.',
      rating: 5,
    },
    {
      name: 'Ewa Wiśniewska',
      role: 'Entuzjastka Zdrowego Stylu Życia',
      content:
        'Funkcje ograniczeń dietetycznych są niesamowite. W końcu aplikacja, która naprawdę rozumie mój bezglutenowy, niskowęglowodanowy styl życia.',
      rating: 5,
    },
  ];
}
