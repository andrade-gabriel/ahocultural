// store.ts (contact)

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import type { Contact, ContactRow } from "./types";
import { mapRowToContact } from "./mapper";

/**
 * Busca o registro mais recente de "contact" no banco.
 * Caso não exista nenhum registro, retorna undefined.
 */
export async function getContactAsync(
  config: DatabaseConfig
): Promise<Contact | undefined> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      id,
      body_pt,
      body_en,
      body_es,
      created_at,
      updated_at
    FROM \`contact\`
    ORDER BY id DESC
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql);

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const row = rows[0] as ContactRow;
  return mapRowToContact(row);
}

/**
 * Insere um novo registro de Contact.
 */
export async function insertContactAsync(
  config: DatabaseConfig,
  request: Contact
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  const [result]: any = await pool.query(
    `
      INSERT INTO \`contact\`
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
 * Atualiza o registro mais recente de Contact.
 * Caso não exista nenhum registro, retorna false.
 */
export async function updateContactAsync(
  config: DatabaseConfig,
  request: Contact
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
      FROM \`contact\`
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
      UPDATE \`contact\`
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