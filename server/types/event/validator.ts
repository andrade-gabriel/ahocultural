import { EventRequest } from "./types";

export function validateEvent(event: EventRequest): string[] {
  const errors: string[] = [];

  const isEmpty = (value?: string | null) =>
    !value || value.trim().length < 2;

  // slug
  if (
    !event.slug ||
    isEmpty(event.slug.pt) ||
    isEmpty(event.slug.en) ||
    isEmpty(event.slug.es)
  )
    errors.push("O campo `slug` deve ser informado em todos os idiomas (pt, en, es).");

  // title
  if (
    !event.title ||
    isEmpty(event.title.pt) ||
    isEmpty(event.title.en) ||
    isEmpty(event.title.es)
  )
    errors.push("O campo `title` deve ser informado em todos os idiomas (pt, en, es).");

  // body
  if (
    !event.body ||
    isEmpty(event.body.pt) ||
    isEmpty(event.body.en) ||
    isEmpty(event.body.es)
  )
    errors.push("O campo `body` deve ser informado em todos os idiomas (pt, en, es).");

  // heroImage
  if (!event.heroImage || event.heroImage.trim().length < 2)
    errors.push("O campo `heroImage` deve ser informado.");

  // thumbnail
  if (!event.thumbnail || event.thumbnail.trim().length < 2)
    errors.push("O campo `thumbnail` deve ser informado.");

  // category
  if (!event.category || event.category.trim().length < 2)
    errors.push("O campo `category` deve ser informado.");

  // company
  if (!event.company || event.company.trim().length < 2)
    errors.push("O campo `company` deve ser informado.");

  // startDate e endDate
  if (!event.startDate)
    errors.push("O campo `startDate` deve ser informado.");
  if (!event.endDate)
    errors.push("O campo `endDate` deve ser informado.");
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      errors.push("As datas `startDate` e `endDate` devem estar em formato válido.");
    else if (end < start)
      errors.push("A data `endDate` não pode ser anterior à `startDate`.");
  }

  // pricing
  if (event.pricing == null || isNaN(Number(event.pricing)) || Number(event.pricing) < 0)
    errors.push("O campo `pricing` deve ser um número válido e não negativo.");

  // facilities
  if (!event.facilities || !Array.isArray(event.facilities) || event.facilities.length === 0)
    errors.push("O campo `facilities` deve conter ao menos um item.");

  // externalTicketLink (opcional, mas se informado, deve ser uma URL válida)
  if (event.externalTicketLink && !/^https?:\/\/\S+$/i.test(event.externalTicketLink))
    errors.push("O campo `externalTicketLink`, se informado, deve ser uma URL válida.");

  // TODO: Validate if category already exists (ex: via banco ou repositório externo)

  return errors;
}
