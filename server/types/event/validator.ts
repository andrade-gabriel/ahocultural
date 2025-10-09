import { EventRequest } from "./types";

export function validateEvent(
  event: EventRequest
): string[] {
  const errors: string[] = [];
  // slug
  if (!event.slug || event.slug.trim().length < 2)
    errors.push("O campo `slug` deve ser informado.");

  // title
  if (!event.title || event.title.trim().length < 2)
    errors.push("O campo `title` deve ser informado.");

  // heroImage
  if (!event.heroImage || event.heroImage.trim().length < 2)
    errors.push("O campo `heroImage` deve ser informado.");

  // thumbnail
  if (!event.thumbnail || event.thumbnail.trim().length < 2)
    errors.push("O campo `thumbnail` deve ser informado.");

  // body
  if (!event.body || event.body.trim().length < 2)
    errors.push("O campo `body` deve ser informado.");

  // TODO: Validate if category already exists
  return errors;
}