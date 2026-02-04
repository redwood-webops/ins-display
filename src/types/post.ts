export interface Post {
  id: string;
  caption: string | null;
  media_type: MediaType;
  media_url: string | null;
  permalink: string | null;
  // ISO8601 timestamp.
  timestamp: string;
  children: Post[] | null;
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  CAROUSEL = "CAROUSEL_ALBUM",
}
