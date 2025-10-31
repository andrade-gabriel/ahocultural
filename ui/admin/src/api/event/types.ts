import type { I18nValue } from "../i18n/types";

export type ListEventsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Event = {
  id: string;
  title: I18nValue;
  slug: I18nValue;
  category: string;
  location: string;
  company: string;
  heroImage: string;
  thumbnail: string;
  body: I18nValue;
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
  title: I18nValue;
  slug: I18nValue;
  category: string;
  location: string;
  company: string;
  heroImage: string;
  thumbnail: string;
  body: I18nValue;
  startDate: Date;
  endDate: Date;
  pricing: number;
  externalTicketLink: string;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};