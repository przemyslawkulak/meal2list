<conversation_summary>
<decisions>

1. Zakres ekranów MVP: logowanie, rejestracja, szczegóły listy zakupowej (checkbox + usuwanie inline), generowanie listy z tekstu przepisu, dodawanie/edycja ręczna pozycji.
2. Przepisy nie są zapisywane w MVP – tylko ad-hoc generacja.
3. Domyślny flow to automatyczne generowanie produktów, z opcją ręcznego dodawania i edycji.
4. Pod polem textarea pokazujemy licznik znaków i komunikat o przekroczeniu limitu (5000).
5. Nawigacja: `MatSidenav` na desktopie, hamburger + menu od góry na tablecie i mobilkach szerokość zgodnie z material layout
   (max-width: 839.98px) and (orientation: portrait), (max-width: 1279.98px) and (orientation: landscape).
6. Inline: oznaczanie jako kupione; edycja ilości, jednostek, kategorii i usuwanie w drawerze z prawej strony (backdrop).
7. Produkty w MVP sortowane dynamicznie w jednej liście (bez sekcji).
8. Generacja: zamiast pollingu – dynamiczny „shining text effect” z komunikatami etapów; max czas oczekiwania 60 s.
9. RLS Supabase: ukrywamy listy innych użytkowników, brak dostępu do edycji cudzych.
10. Kategorie preloadowane przy starcie aplikacji i cache’owane.
11. Obsługa błędów sieciowych, 401, 404, 500 przez globalny interceptor + `MatSnackBar`, bład 401 przekierowuje na strone logowania.
12. Dedykowany widok dodawania pozycji z multi-select + przycisk „Dodaj”; domyślnie `1 pcs`.
13. Podejście mobile-first z Angular Material Layout i breakpointami dla tabletu/mobilki (hamburger).
14. Pełne WCAG: role ARIA, trap focus w drawerze, kontrasty, czytniki ekranu.
15. Stan aplikacji w Signal Store (`@ngrx/signals`); serwisy do komunikacji z Supabase.
16. Trasy jako standalone components lazy-loaded za pomocą `loadComponent`.
17. Chronione ścieżki z `AuthGuard`.
18. UX loadingu za pomocą loaderów i skeletonów zamiast resolvers.
19. Brak wirtualizacji/infinite scroll – listy są krótkie.
20. Reużywalny `MatDrawer` do edycji produktów.  
    </decisions>

<matched_recommendations>

1. Stosowanie standalone lazy-loaded components (`loadComponent`) zamiast modułów.
2. Zabezpieczanie tras `AuthGuard`.
3. UX loadingu: skeleton + loader zamiast route resolvers.
4. Globalny `ErrorInterceptor` do obsługi HTTP 401/404/500 + `MatSnackBar`.
5. Preload i cache kategorii w serwisie z RxJS `shareReplay`.
6. Reużywalny drawer (`MatDrawer`) z backdropem i `cdkTrapFocus` dla edycji produktu.
7. Mobile-first, Angular Material Layout z breakpointami.
8. Signal Store (`@ngrx/signals`) jako główny store aplikacji.
9. Dynamiczny komponent statusu generacji z Angular Animation (shining text).
10. Dedykowany widok batch-add z multi-select i domyślnymi wartościami.  
    </matched_recommendations>

<ui_architecture_planning_summary>
MVP będzie zbudowane jako zestaw standalone components lazy-loaded przez Angular router, z główną nawigacją opartą o `MatSidenav` (desktop) i hamburger menu (tablet/mobilki). Ekrany to logowanie, rejestracja, szczegóły listy zakupowej z inline-checkboxami i przyciskiem usuwania, widok generacji produktów z dynamicznym efektem tekstowym oraz oddzielny widok dodawania pozycji z multi-select. Dane kategorii preloadujemy przy starcie i cache’ujemy. Komunikacja z API odbywa się w serwisach zwracających `Observable` (Supabase SDK), stan globalny trzymamy w Signal Store. Błędy HTTP obsługujemy globalnym interceptor-em i wyświetlamy w `MatSnackBar`. Wszystkie formularze tworzymy na Reactive Forms z walidacją i loaderami/skeletonami dla lepszego UX. Responsywność zapewnia Angular Material Layout, a dostępność – role ARIA, trap focus, kontrast. Autoryzacja bazuje na `AuthGuard`, zaś trasy chronione wymagają ważnego tokena Supabase.  
</ui_architecture_planning_summary>

<unresolved_issues>

1. Mechanizm przechowywania JWT (HttpOnly cookie vs storage) – do decyzji.
2. Dokładne wartości breakpointów w px dla przełączania sidenav ↔ hamburger.
3. Potwierdzenie usuwania całej listy (dialog) – implementacja UX.
4. Docelowa strategia testów (jednostkowe vs e2e) – priorytety.
5. Rozszerzenia batch-add (filtry/kategorie) – poza MVP.  
   </unresolved_issues>
   </conversation_summary>
