import { ArticleRequest } from "./types";

export function validateArticle(
  article: ArticleRequest
): string[] {
  const errors: string[] = [];
  // slug
  if (!article.slug || article.slug.trim().length < 2)
    errors.push("O campo `slug` deve ser informado.");

  // title
  if (!article.title || article.title.trim().length < 2)
    errors.push("O campo `title` deve ser informado.");

  // imageUrl
  if (!article.heroImage || article.heroImage.trim().length < 2)
    errors.push("O campo `heroImage` deve ser informado.");

  // thumbnail
  if (!article.thumbnail || article.thumbnail.trim().length < 2)
    errors.push("O campo `thumbnail` deve ser informado.");

  // body
  if (!article.body || article.body.trim().length < 2)
    errors.push("O campo `body` deve ser informado.");

  return errors;
}