export interface FetchedMeta {
  title: string;
  cover?: string;
  author?: string;
  canonicalUrl: string;
}

export interface PlatformAdapter {
  name: string;
  match(url: string): boolean;
  fetchMeta(url: string): Promise<FetchedMeta>;
}
