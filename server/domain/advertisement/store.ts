// store.ts (advertisement)

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import type { Advertisement, AdvertisementRow } from "./types";
import { mapRowToAdvertisement } from "./mapper";

/**
 * Busca o registro mais recente de "advertisement" no banco.
 * Caso não exista nenhum registro, retorna undefined.
 */
export async function getAdvertisementAsync(
  config: DatabaseConfig
): Promise<Advertisement | undefined> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      id,
      body_pt,
      body_en,
      body_es,
      created_at,
      updated_at
    FROM \`advertisement\`
    ORDER BY id DESC
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql);

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const row = rows[0] as AdvertisementRow;
  return mapRowToAdvertisement(row);
}

/**
 * Insere um novo registro de Advertisement.
 */
export async function insertAdvertisementAsync(
  config: DatabaseConfig,
  request: Advertisement
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  const [result]: any = await pool.query(
    `
      INSERT INTO \`advertisement\`
        (body_pt, body_en, body_es, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?)
    `,
    [bodyPt, bodyEn, bodyEs, now, now]
  );

  return (
    !!result &&
    typeof result.affectedRows === "number" &&
    result.affectedRows > 0
  );
}

/**
 * Atualiza o registro mais recente de Advertisement.
 * Caso não exista nenhum registro, retorna false.
 */
export async function updateAdvertisementAsync(
  config: DatabaseConfig,
  request: Advertisement
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  // Busca o último registro (mesma lógica que o upsert antigo)
  const [rows]: any = await pool.query(
    `
      SELECT id
      FROM \`advertisement\`
      ORDER BY id DESC
      LIMIT 1
    `
  );

  const existing = rows && rows.length > 0 ? (rows[0] as { id: number }) : null;

  if (!existing) {
    // Sem registro para atualizar
    return false;
  }

  const [result]: any = await pool.query(
    `
      UPDATE \`advertisement\`
      SET
        body_pt = ?,
        body_en = ?,
        body_es = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [bodyPt, bodyEn, bodyEs, now, existing.id]
  );

  return (
    !!result &&
    typeof result.affectedRows === "number" &&
    result.affectedRows > 0
  );
}