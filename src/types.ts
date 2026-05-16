export interface Listing {
  id: string;
  title: string;
  link: string;
}

export type History = Listing[][];

export interface Config {
  urls: string[];
  intervalMinutes: number;
  fetchCount: number;
}
