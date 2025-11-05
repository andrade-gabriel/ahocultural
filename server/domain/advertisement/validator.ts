import { AdvertisementRequest } from "./types";

export function validateAdvertisement(item: AdvertisementRequest): string[] {
  const errors: string[] = [];

  const isEmpty = (value?: string | null) =>
    !value || value.trim().length < 2;

  // body
  if (!item.body || isEmpty(item.body.pt) || isEmpty(item.body.en) || isEmpty(item.body.es))
    errors.push("O campo `body` deve ser informado em todos os idiomas (pt, en, es).");

  return errors;
}