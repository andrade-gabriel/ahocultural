import type { I18nValue } from "../i18n/types";

export type ListArticlesParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  publicationDate: Date;
  active: boolean;
};

export type ArticleDetail = {
  id: string;
  title: I18nValue;
  slug: I18nValue;
  heroImage: string;
  thumbnail: string;
  body: I18nValue;
  publicationDate: Date;
  active: boolean;
};