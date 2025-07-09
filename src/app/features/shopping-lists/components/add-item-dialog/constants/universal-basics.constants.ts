export const UNIVERSAL_BASICS = [
  // Podstawowe produkty
  'Chleb',
  'Mleko',
  'Jajka',
  'Masło',
  'Ryż',
  'Makaron',
  'Ziemniaki',
  'Mąka Pszenna',
  'Cukier',
  'Sól',

  // Białka
  'Kurczak',
  'Mięso Mielone',
  'Ryba',
  'Ser',
  'Jogurt',
  'Fasola Konserwowa',
  'Orzechy Włoskie',
  'Kiełbasa',

  // Warzywa
  'Cebula',
  'Marchewka',
  'Pomidor',
  'Sałata',
  'Papryka',
  'Brokuły',
  'Szpinak',
  'Ogórek',

  // Owoce
  'Jabłka',
  'Banany',
  'Pomarańcze',
  'Cytryna',
  'Truskawki',

  // Przyprawy i podstawy
  'Olej',
  'Ocet',
  'Czosnek',
  'Pieprz Czarny',
  'Papryka Słodka',
  'Oregano',
  'Bazylia',
  'Cynamon',

  // Napoje
  'Kawa',
  'Herbata',
  'Woda',
  'Sok Pomarańczowy',
  'Piwo',
  'Wino Czerwone',

  // Mrożonki
  'Warzywa Mrożone',
  'Pizza Mrożona',
  'Lody',
  'Owoce Mrożone',

  // Artykuły gospodarstwa domowego
  'Papier Toaletowy',
  'Mydło',
  'Proszek do Prania',
  'Pasta do Zębów',
  'Szampon',

  // Pieczenie
  'Proszek do Pieczenia',
  'Drożdże',
  'Kakao',
  'Miód',
  'Dżem',

  // Konserwy
  'Pomidory Krojone',
  'Groszek Konserwowy',
  'Tuńczyk w Oleju',
  'Kukurydza Konserwowa',
  'Koncentrat Pomidorowy',
];

/**
 * Checks if a product name is a universal basic product
 * @param productName The product name to check
 * @returns True if the product is a universal basic
 */
export function isUniversalBasic(productName: string): boolean {
  return UNIVERSAL_BASICS.some(basic => basic.toLowerCase() === productName.toLowerCase());
}
