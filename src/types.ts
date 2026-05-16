export interface Listing {
  id: string;
  title: string;
  link: string;
}

export type HistoryByUrl = Record<string, Listing[]>;

export interface HistoryFileV1 {
  version: 1;
  searches: HistoryByUrl;
}

export interface Config {
  urls: string[];
  intervalMinutes: number;
  fetchCount: number;
}
