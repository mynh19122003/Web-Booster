export type ShopAccount = {
  id: string;
  game: string;
  title: string;
  rank: string;
  division: string;
  server: string;
  level: number;
  champions: number;
  skins: number;
  essence: number;
  points: number;
  ownedChampions?: string[];
  cosmetics: string[];
  lpGain: number;
  price: number;
  tags: string[];
  items: string[];
};
