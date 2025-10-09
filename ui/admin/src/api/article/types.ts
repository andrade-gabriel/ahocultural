export type ListArticlesParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  heroImage: string;
  thumbnail: string;
  body: string;
  publicationDate: Date;
  active: boolean;
};

export type ArticleDetail = {
  id: string;
  title: string;
  slug: string;
  heroImage: string;
  thumbnail: string;
  body: string;
  publicationDate: Date;
  active: boolean;
};