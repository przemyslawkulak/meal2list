<conversation_summary>
<decisions>

- Nazwy tabel i kolumn będą w języku angielskim: user, recipe, product, list, category, generation, generation_error.
- Relacje między encjami będą many-to-many od samego początku, obejmujące m.in. połączenia: user-to-list, recipe-to-product, list-to-product.
- Tekst przepisu będzie przechowywany jako pole tekstowe z walidacją po stronie frontendu (maksymalnie 5000 znaków).
- Atrybuty asocjacyjne (quantity, unit, status, source) będą zarządzane za pomocą tabel łącznikowych.
- Pole "source" w tabeli Recipes przyjmie dowolny tekst.
- Każdy produkt będzie przypisany do pojedynczej kategorii, wymuszonej przez klucz obcy.
- Wszystkie odpowiednie tabele będą zawierać standardowe pola: created_at, updated_at, user_id.
- Nazwa listy zakupowej będzie generowana automatycznie na podstawie przepisu, z możliwością późniejszej edycji przez użytkownika.
- Tabele Recipes i ShoppingLists będą powiązane – automatycznie dodane produkty będą oznaczone informacją, z którego przepisu pochodzą.
- Tabela ShoppingListItems będzie zawierać oddzielne kolumny: product_name, quantity oraz unit.
- Każdy produkt będzie reprezentował pojedynczą pozycję (np. "mąka" domyślnie oznacza mąkę przenną, odmienne warianty traktowane są jako osobne produkty).
- Produkty bez przypisanej kategorii będą automatycznie przypisywane do domyślnej kategorii "Inne".
- Wszyscy użytkownicy będą mieli uprawnienia do odczytu tabeli Categories.
- Zarządzanie kategoriami w MVP będzie realizowane ręcznie (bez dedykowanego interfejsu administracyjnego), z możliwością rozbudowy w przyszłości.
- Utworzone zostaną osobne encje: Generation (powiązana z jednym przepisem, jedną listą i wieloma produktami, zawiera pole generation_time) oraz Generation_Error (powiązana z jednym przepisem i jedną listą, zawiera pola error_message oraz error_code).
- Na etapie MVP nie są wymagane zaawansowane mechanizmy filtrowania i paginacji.
- Audyt oraz historia zmian będą implementowane poprzez dodatkowe kolumny w istniejących tabelach.
  </decisions>
  <matched_recommendations>
- Używanie spójnego, angielskiego nazewnictwa dla wszystkich głównych tabel i kolumn.
- Projekt bazy danych powinien opierać się od samego początku na relacjach many-to-many z wykorzystaniem tabel łącznikowych.
- Przechowywanie tekstu przepisu w polu tekstowym z walidacją ograniczającą do 5000 znaków po stronie frontendu.
- Atrybuty związane z relacjami (np. quantity, unit, status, source) powinny być przechowywane w tabelach łącznikowych.
- Wymuszenie relacji produktu do kategorii za pomocą klucza obcego.
- Wszystkie tabele związane z danymi użytkownika powinny zawierać pola created_at, updated_at oraz user_id, co wspiera autoryzację i integralność danych.
- Jasne zdefiniowanie relacji dla encji Generation i Generation_Error.
- Przygotowanie struktury bazy danych na przyszłe potrzeby audytu poprzez dodatkowe kolumny.
- Zastosowanie UUID jako kluczy głównych dla tabel: Users, Recipes, ShoppingLists, ShoppingListItems, Categories, Generation, Generation_Error, dla lepszej skalowalności.
- Użycie typu TIMESTAMPTZ dla pól czasowych (np. created_at, updated_at) z domyślną wartością NOW(), umożliwiające automatyczne aktualizacje za pomocą triggerów.
- Automatyczne generowanie nazwy listy zakupowej na podstawie przepisu, z możliwością edycji oraz opcjonalnym powiązaniem z tabelą Recipes.
- W tabeli ShoppingListItems utworzenie oddzielnych kolumn: product_name (TEXT), quantity (NUMERIC lub FLOAT) oraz unit (VARCHAR).
- Utworzenie tabeli Categories z domyślną kategorią "Inne" dla produktów nieprzypisanych do konkretnej kategorii.
- Wdrożenie Row-Level Security (RLS) we wszystkich tabelach z polityką umożliwiającą odczyt tabeli Categories wszystkim użytkownikom.
- Indeksacja kolumn kluczy obcych (np. user_id, list_id, category_id) dla zoptymalizowania operacji JOIN oraz umożliwienia przyszłego rozszerzenia filtrowania i paginacji.
  </matched_recommendations>
  <database_planning_summary>
- Schemat bazy danych MVP obejmuje następujące główne encje: Users (opcjonalnie odpowiedzialnych za autentykację), Recipes, ShoppingLists, ShoppingListItems, Categories, Generation oraz Generation_Error.
- Nazewnictwo tabel i kolumn będzie w języku angielskim.
- Relacje między encjami będą projektowane jako many-to-many od samego początku, z użyciem tabel łącznikowych do przechowywania atrybutów specyficznych dla relacji, takich jak: quantity, unit, status, source oraz oznaczenie przepisu pochodzenia produktów.
- Tekst przepisu będzie przechowywany jako pole tekstowe (max 5000 znaków) z walidacją po stronie frontendu.
- Produkty będą przypisywane do pojedynczej kategorii (wymuszonej przez klucz obcy); produkty bez przypisania będą domyślnie oznaczane jako "Inne".
- Wszystkie tabele wymagające danych użytkownika będą zawierać pola created_at, updated_at oraz user_id, co zapewni odpowiednią autoryzację (np. w środowisku Supabase).
- Encja Generation będzie powiązana z jednym przepisem, jedną listą i wieloma produktami, zawierając pole generation_time.
- Encja Generation_Error będzie powiązana z jednym przepisem i jedną listą, zawierając pola error_message oraz error_code.
- System został zaprojektowany z myślą o przyszłym wdrożeniu mechanizmów audytu i historii zmian poprzez dodatkowe kolumny.
- Bezpieczeństwo zostanie wzmocnione przez wdrożenie Row-Level Security (RLS) we wszystkich tabelach oraz indeksację kluczy obcych (np. user_id, list_id, category_id) dla optymalizacji operacji JOIN.
- Generowanie nazwy listy zakupowej odbywać się będzie automatycznie na podstawie przepisu, z możliwością późniejszej edycji oraz opcjonalnym powiązaniem z tabelą Recipes.
- Tabela ShoppingListItems będzie przechowywać dane produktów w oddzielnych kolumnach: product_name, quantity oraz unit.
  </database_planning_summary>
  <unresolved_issues>
- Szczegółowe strategie indeksacji oraz potencjalne metody partycjonowania nie zostały jeszcze ostatecznie ustalone.
- Plany migracji z rozwiązania MVP many-to-many do środowisk produkcyjnych wymagają dalszych ustaleń.
- Na obecnym etapie nie zidentyfikowano innych nierozwiązanych kwestii.
- W przyszłości mogą pojawić się dodatkowe wymagania dotyczące interfejsu administracyjnego do zarządzania kategoriami oraz rozbudowanych mechanizmów filtrowania i paginacji.
  </unresolved_issues>
  </conversation_summary>
