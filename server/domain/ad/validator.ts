import { Ad, AdCategory, AdMenu, AdType } from "./types";

type AnyAd = Ad | AdCategory | AdMenu;

const isEmpty = (value?: string | null) =>
  !value || value.trim().length < 2;

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !isNaN(value.getTime());

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value) && value >= 0;

function validateBase(item: AnyAd): string[] {
  const errors: string[] = [];

  // type
  if (item.type === undefined || item.type === null) {
    errors.push("O campo `type` deve ser informado.");
  }

  // title
  if (
    !item.title ||
    isEmpty(item.title.pt) ||
    isEmpty(item.title.en) ||
    isEmpty(item.title.es)
  ) {
    errors.push("O campo `title` deve ser informado nos idiomas pt, en e es.");
  }

  // datas
  if (isEmpty(item.url)) {
    errors.push("O campo `url` deve ser uma data válida.");
  }

  // datas
  if (item.startDate instanceof Date) {
    errors.push("O campo `startDate` deve ser uma data válida.");
  }

  if (item.endDate instanceof Date) {
    errors.push("O campo `endDate` deve ser uma data válida.");
  }

  if (
    item.startDate as Date &&
    item.endDate as Date &&
    (item.startDate as Date) > (item.endDate as Date)
  ) {
    errors.push("`startDate` não pode ser maior que `endDate`.");
  }

  // thumbnail
  if (isEmpty(item.thumbnail)) {
    errors.push("O campo `thumbnail` deve ser informado.");
  }

  // pricing
  if (!isNonNegativeNumber(item.pricing)) {
    errors.push("O campo `pricing` deve ser um número >= 0.");
  }

  return errors;
}

function validateCategory(item: AdCategory): string[] {
  const errors: string[] = [];

  if (!item.categoryId || item.categoryId <= 0) {
    errors.push("O campo `categoryId` deve ser um número maior que zero.");
  }

  return errors;
}

function validateMenu(item: AdMenu): string[] {
  const errors: string[] = [];

  if (!item.menuType || item.menuType <= 0) {
    errors.push("O campo `menuType` deve ser um número maior que zero.");
  }

  return errors;
}

// ---- MAPA DE VALIDADORES por tipo ----
const validatorMap: Record<
  AdType,
  ((item: AnyAd) => string[]) | undefined
> = {
  [AdType.Category]: (item: AnyAd) =>
    item.type === AdType.Category
      ? validateCategory(item as AdCategory)
      : [
        "Inconsistência: esperado AdCategory para `type = Category`.",
      ],

  [AdType.Menu]: (item: AnyAd) =>
    item.type === AdType.Menu
      ? validateMenu(item as AdMenu)
      : ["Inconsistência: esperado AdMenu para `type = Menu`."],
};

export function validateAd(item: AnyAd): string[] {
  const errors: string[] = [];

  errors.push(...validateBase(item));
  const validatorFn = validatorMap[item.type];
  if (!validatorFn) {
    errors.push("Tipo de anúncio inválido ou não suportado.");
    return errors;
  }
  
  errors.push(...validatorFn(item));
  return errors;
}
