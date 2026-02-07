export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  children?: {
    data: InstagramChild[];
  };
}

export interface InstagramChild {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
}

export interface InstagramMediaResponse {
  data: InstagramPost[];
}
