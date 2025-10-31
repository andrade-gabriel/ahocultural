import { ArticleRequest } from "./types";

export function validateArticle(article: ArticleRequest): string[] {
  const errors: string[] = [];

  const isEmpty = (value?: string | null) =>
    !value || value.trim().length < 2;

  // slug
  if (!article.slug || isEmpty(article.slug.pt) || isEmpty(article.slug.en) || isEmpty(article.slug.es))
    errors.push("O campo `slug` deve ser informado em todos os idiomas (pt, en, es).");

  // title
  if (!article.title || isEmpty(article.title.pt) || isEmpty(article.title.en) || isEmpty(article.title.es))
    errors.push("O campo `title` deve ser informado em todos os idiomas (pt, en, es).");

  // body
  if (!article.body || isEmpty(article.body.pt) || isEmpty(article.body.en) || isEmpty(article.body.es))
    errors.push("O campo `body` deve ser informado em todos os idiomas (pt, en, es).");

  // heroImage
  if (!article.heroImage || article.heroImage.trim().length < 2)
    errors.push("O campo `heroImage` deve ser informado.");

  // thumbnail
  if (!article.thumbnail || article.thumbnail.trim().length < 2)
    errors.push("O campo `thumbnail` deve ser informado.");

  return errors;
}