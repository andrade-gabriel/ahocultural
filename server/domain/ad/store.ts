// store.ts (ad)

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import {
  AnyAd,
  AdCategory,
  AdMenu,
  AdType,
  AdRow,
  AdListItem,
} from "./types";
import { mapRowToAd, mapRowToAdListItem } from "./mapper";

/**
 * Escritor de "detalhe" do Ad, por tipo
 */
type AdDetailWriter = (conn: any, adId: number, ad: AnyAd) => Promise<void>;

/**
 * Fábrica (map) que sabe como persistir o detalhe do Ad,
 * dependendo do tipo (Category / Menu).
 */
const adDetailWriterMap: Record<AdType, AdDetailWriter | undefined> = {
  [AdType.Category]: async (conn, adId, ad) => {
    if (ad.type !== AdType.Category) {
      throw new Error("Inconsistência: esperado AdCategory para AdType.Category.");
    }
    
    const item = ad as AdCategory;
    const sql = `
      INSERT INTO \`ad_category\` (ad_id, category_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        category_id = VALUES(category_id)
    `;

    await conn.execute(sql, [adId, item.categoryId]);
  },

  [AdType.Menu]: async (conn, adId, ad) => {
    if (ad.type !== AdType.Menu) {
      throw new Error("Inconsistência: esperado AdMenu para AdType.Menu.");
    }

    const item = ad as AdMenu;
    const sql = `
      INSERT INTO \`ad_menu\` (ad_id, ad_menu_type)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        ad_menu_type = VALUES(ad_menu_type)
    `;

    await conn.execute(sql, [adId, item.menuType]);
  },
};

async function writeAdDetailsAsync(conn: any, adId: number, ad: AnyAd): Promise<void> {
  const writer = adDetailWriterMap[ad.type];
  if (!writer) return;
  await writer(conn, adId, ad);
}

/**
 * Busca um Ad por id, já com JOIN em ad_category / ad_menu / ad_menu_type
 */
export async function getAdAsync(
  config: DatabaseConfig,
  id: number
): Promise<AnyAd | undefined> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      a.id,
      a.ad_type_id        AS ad_type_id,
      a.url               AS url,
      a.start_date        AS start_date,
      a.end_date          AS end_date,
      a.title_pt          AS title_pt,
      a.title_en          AS title_en,
      a.title_es          AS title_es,
      a.thumbnail         AS thumbnail,
      a.pricing           AS pricing,
      a.active            AS active,
      a.created_at        AS created_at,
      a.updated_at        AS updated_at,
      c.category_id       AS category_id,
      am.ad_menu_type     AS ad_menu_type_id,
      amt.name            AS ad_menu_type_name
    FROM \`ad\` a
    LEFT JOIN \`ad_category\` c
      ON c.ad_id = a.id
    LEFT JOIN \`ad_menu\` am
      ON am.ad_id = a.id
    LEFT JOIN \`ad_menu_type\` amt
      ON amt.id = am.ad_menu_type
    WHERE a.id = ?
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql, [id]);

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const row = rows[0] as AdRow;
  return mapRowToAd(row);
}

/**
 * Insere um novo Ad
 */
export async function insertAdAsync(
  config: DatabaseConfig,
  request: AnyAd
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();

  let success = false;
  const now = new Date();

  const titlePt = request.title?.pt ?? "";
  const titleEn = request.title?.en ?? "";
  const titleEs = request.title?.es ?? "";

  const url = request.url ?? '';

  const startDate = request.startDate ?? now;
  const endDate = request.endDate ?? now;

  const thumbnail = request.thumbnail ?? "";
  const pricing = request.pricing ?? 0;

  const active = typeof request.active === "boolean" ? request.active : true;

  try {
    await conn.beginTransaction();

    const [result]: any = await conn.execute(
      `
        INSERT INTO \`ad\`
          (
            ad_type_id,
            url,
            start_date,
            end_date,
            title_pt,
            title_en,
            title_es,
            thumbnail,
            pricing,
            active,
            created_at,
            updated_at
          )
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        request.type,
        url,
        startDate,
        endDate,
        titlePt,
        titleEn,
        titleEs,
        thumbnail,
        pricing,
        active,
        now,
        now,
      ]
    );

    const adId: number | undefined =
      result && typeof result.insertId === "number" ? result.insertId : undefined;

    if (!adId) {
      throw new Error("Falha ao obter insertId para Ad.");
    }

    await writeAdDetailsAsync(conn, adId, request);

    await conn.commit();
    success = true;
  } catch (e) {
    await conn.rollback();
    console.error("Error inserting Ad:", e);
  } finally {
    conn.release();
  }

  return success;
}

/**
 * Atualiza um Ad existente
 */
export async function updateAdAsync(
  config: DatabaseConfig,
  request: AnyAd
): Promise<boolean> {
  if (!Number.isInteger(request.id) || request.id <= 0) {
    throw new Error("id inválido para updateAdAsync.");
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();

  let success = false;
  const now = new Date();

  const titlePt = request.title?.pt ?? "";
  const titleEn = request.title?.en ?? "";
  const titleEs = request.title?.es ?? "";

  const url = request.url ?? "";

  const startDate = request.startDate ?? now;
  const endDate = request.endDate ?? now;

  const thumbnail = request.thumbnail ?? "";
  const pricing = request.pricing ?? 0;

  const active = typeof request.active === "boolean" ? request.active : true;

  try {
    await conn.beginTransaction();

    const [result]: any = await conn.execute(
      `
        UPDATE \`ad\`
        SET
          ad_type_id = ?,
          url = ?,
          start_date = ?,
          end_date = ?,
          title_pt = ?,
          title_en = ?,
          title_es = ?,
          thumbnail = ?,
          pricing = ?,
          active = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        request.type,
        url,
        startDate,
        endDate,
        titlePt,
        titleEn,
        titleEs,
        thumbnail,
        pricing,
        active,
        now,
        request.id,
      ]
    );

    if (!result || result.affectedRows <= 0) {
      await conn.rollback();
      return false;
    }

    // limpa detalhes antigos
    await conn.execute("DELETE FROM `ad_category` WHERE ad_id = ?", [request.id]);
    await conn.execute("DELETE FROM `ad_menu` WHERE ad_id = ?", [request.id]);

    // escreve o detalhe baseado no tipo atual
    await writeAdDetailsAsync(conn, request.id, request);

    await conn.commit();
    success = true;
  } catch (e) {
    await conn.rollback();
    console.error("Error updating Ad:", e);
  } finally {
    conn.release();
  }

  return success;
}

/**
 * Atualiza apenas o campo `active`
 */
export async function updateAdActiveAsync(
  config: DatabaseConfig,
  adId: number,
  active: boolean
): Promise<boolean> {
  if (!Number.isInteger(adId) || adId <= 0) {
    throw new Error("adId inválido.");
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let success = false;

  const sql = `
    UPDATE \`ad\`
    SET \`active\` = ?, \`updated_at\` = ?
    WHERE \`id\` = ?
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();
    const [res]: any = await conn.execute(sql, [active, now, adId]);
    success = res.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error("Error updating Ad active status:", e);
  } finally {
    conn.release();
  }

  return success;
}

function escapeLikeTermRaw(term: string): string {
  return term
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Lista Ads com filtro opcional por título (qualquer idioma)
 */
export async function listAdsAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  title?: string | null
): Promise<AdListItem[]> {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error("skip inválido — deve ser inteiro >= 0");
  }
  if (!Number.isInteger(take) || take <= 0) {
    throw new Error("take inválido — deve ser inteiro > 0");
  }

  const MAX_TAKE = 500;
  const safeTake = Math.min(take, MAX_TAKE);

  const pool = getConnectionPool(config);
  const esc = (v: any) => (pool as any).escape(v);

  let whereClause = "";
  if (title && title.trim() !== "") {
    const raw = escapeLikeTermRaw(title.trim());
    const likeWithPercents = `%${raw}%`;
    const escapedLike = esc(likeWithPercents);

    whereClause = `
      WHERE a.title_pt LIKE ${escapedLike} ESCAPE '!'
    `;
  }

  const escapedOffset = esc(skip);
  const escapedRowCount = esc(safeTake);

  const sql = `
    SELECT
      a.id,
      a.ad_type_id     AS ad_type_id,
      a.title_pt       AS title_pt,
      a.start_date     AS start_date,
      a.end_date       AS end_date,
      a.active         AS active
    FROM \`ad\` a
    ${whereClause}
    ORDER BY a.start_date DESC, a.id DESC
    LIMIT ${escapedOffset}, ${escapedRowCount}
  `;

  const [rows]: any = await pool.query(sql);

  return (rows || []).map((r: AdRow) => mapRowToAdListItem(r));
}
