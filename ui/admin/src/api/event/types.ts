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
  company: string;
  heroImage: string;
  thumbnail: string;
  body: string;
  startDate: Date;
  endDate: Date;
  pricing: number;
  externalTicketLink: string;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};

export type EventDetail = {
  id: string;
  title: string;
  slug: string;
  category: string;
  company: string;
  heroImage: string;
  thumbnail: string;
  body: string;
  startDate: Date;
  endDate: Date;
  pricing: number;
  externalTicketLink: string;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};