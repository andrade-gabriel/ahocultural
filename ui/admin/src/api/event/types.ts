export type ListEventsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Event = {
  id: string;
  title: string;
  slug: string;
  category: string;
  imageUrl: string;
  body: string;
  startDate: Date;
  endDate: Date;
  location: string;
  pricing: number;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};

export type EventDetail = {
  id: string;
  title: string;
  slug: string;
  category: string;
  imageUrl: string;
  body: string;
  startDate: Date;
  endDate: Date;
  location: string;
  pricing: number;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};