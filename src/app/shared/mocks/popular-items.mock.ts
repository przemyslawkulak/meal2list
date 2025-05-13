export interface PopularItem {
  name: string;
  category_id: string;
}

export const CATEGORY_IDS = {
  DAIRY_EGGS: '1b1c61a1-39bb-433f-aa72-9c2a071b3f45',
  BREAD: 'eb47f044-2b74-4f13-8301-50f758b0da34',
  HYGIENE: 'e2a0c876-a67f-4db3-be84-0664b68d9969',
  WATER_BEVERAGES: '4621e1f6-7912-4aa1-b4e0-ade0a0fa4517',
  FRUITS_VEGETABLES: '8b948011-47c2-48a2-8157-e3f3b491d846',
  MEAT: '8682bf27-9fc0-4a81-9dd6-1d7b6040ddbb',
  ALCOHOL: '13cae5f8-a1cb-42cc-a51c-afd1959fa3aa',
  OTHERS: 'd90c5734-6227-4ab8-9acf-d8796db27913',
};

export const POPULAR_ITEMS: PopularItem[] = [
  { name: 'mleko', category_id: CATEGORY_IDS.DAIRY_EGGS },
  { name: 'jajka', category_id: CATEGORY_IDS.DAIRY_EGGS },
  { name: 'chleb', category_id: CATEGORY_IDS.BREAD },
  { name: 'papier toaletowy', category_id: CATEGORY_IDS.HYGIENE },
  { name: 'woda', category_id: CATEGORY_IDS.WATER_BEVERAGES },
  { name: 'pomidory', category_id: CATEGORY_IDS.FRUITS_VEGETABLES },
  { name: 'pieczywo', category_id: CATEGORY_IDS.BREAD },
  { name: 'ser żółty', category_id: CATEGORY_IDS.DAIRY_EGGS },
  { name: 'piwo', category_id: CATEGORY_IDS.ALCOHOL },
  { name: 'wędlina', category_id: CATEGORY_IDS.MEAT },
];
