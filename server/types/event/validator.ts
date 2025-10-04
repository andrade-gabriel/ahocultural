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

  // imageUrl
  if (!event.imageUrl || event.imageUrl.trim().length < 2)
    errors.push("O campo `imageUrl` deve ser informado.");

  // body
  if (!event.body || event.body.trim().length < 2)
    errors.push("O campo `body` deve ser informado.");

  // TODO: Validate if category already exists
  return errors;
}