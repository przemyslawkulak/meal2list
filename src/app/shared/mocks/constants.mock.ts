export const TABS = {
  POPULAR: 'popular',
  HISTORY: 'history',
} as const;

export type TabType = keyof typeof TABS;
export type TabValue = (typeof TABS)[TabType];
