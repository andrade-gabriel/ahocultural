import { ArticleRequest } from "./types";

export function validateArticle(
  article: ArticleRequest
): string[] {
  const errors: string[] = [];
  // id
  if (!article.id || article.id.trim().length < 2)
    errors.push("O campo `id` deve ser informado.");

  // title
  if (!article.title || article.title.trim().length < 2)
    errors.push("O campo `title` deve ser informado.");

  // imageUrl
  if (!article.imageUrl || article.imageUrl.trim().length < 2)
    errors.push("O campo `imageUrl` deve ser informado.");

  // body
  if (!article.body || article.body.trim().length < 2)
    errors.push("O campo `body` deve ser informado.");

  return errors;
}