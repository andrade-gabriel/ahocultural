// mapper.ts

import { I18nValue } from "domain/language/types";
import {
  Ad,
  AdCategory,
  AdMenu,
  AdType,
  AdMenuType,
  AdRow,
  AdListItem,
  AnyAd
} from "./types";

function buildTitle(row: AdRow): I18nValue {
  return {
    pt: row.title_pt ?? "",
    en: row.title_en ?? "",
    es: row.title_es ?? "",
  };
}

/**
 * Mapeia a parte comum de qualquer Ad (sem considerar Category/Menu)
 */
function mapBaseAd(row: AdRow): Ad {
  return {
    id: row.id,
    type: row.ad_type_id as AdType,
    url: row.url,
    startDate: row.start_date,
    endDate: row.end_date,
    title: buildTitle(row),
    thumbnail: row.thumbnail ?? "",
    pricing: row.pricing ? parseFloat(`${row.pricing}`) : 0,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Builders de Ad especializados por tipo
 */
type AdBuilder = (base: Ad, row: AdRow) => AnyAd;

const categoryAdBuilder: AdBuilder = (base, row) => {
  const categoryId = row.category_id ?? 0; // se estiver nulo, problema é de integridade do dado
  const ad: AdCategory = {
    ...base,
    type: AdType.Category,
    categoryId,
  };
  return ad;
};

const menuAdBuilder: AdBuilder = (base, row) => {
  const menuType =
    (row.menu_type as AdMenuType | null | undefined) ??
    AdMenuType.Today;

  const ad: AdMenu = {
    ...base,
    type: AdType.Menu,
    menuType,
  };
  return ad;
};

/**
 * Builder default – se não houver especialização, devolve o base
 */
const defaultAdBuilder: AdBuilder = (base) => base;

/**
 * Mapa de builders por AdType
 */
const adBuilderMap: Partial<Record<AdType, AdBuilder>> = {
  [AdType.Category]: categoryAdBuilder,
  [AdType.Menu]: menuAdBuilder,
};

/**
 * Mapeia uma AdRow completa (com JOINs) para AnyAd (Ad | AdCategory | AdMenu),
 * utilizando apenas map/fábrica para escolher a forma final.
 */
export function mapRowToAd(row: AdRow): AnyAd {
  const base = mapBaseAd(row);
  const builder = adBuilderMap[base.type] ?? defaultAdBuilder;
  return builder(base, row);
}

/**
 * Mapeia uma AdRow para AdListItem (usado em listagens)
 */
export function mapRowToAdListItem(row: AdRow): AdListItem {
  return {
    id: row.id,
    title: row.title_pt ?? "",
    type: row.ad_type_id as AdType,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === 1,
  };
}