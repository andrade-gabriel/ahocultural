// store.ts (studio)

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import type { Studio, StudioCategory, StudioCategoryMediaRow, StudioRow } from "./types";
import { mapRowToStudio } from "./mapper";

/**
 * Busca o registro mais recente de "studio" no banco.
 * Caso não exista nenhum registro, retorna undefined.
 */
export async function getStudioAsync(
  config: DatabaseConfig
): Promise<Studio | undefined> {
  const pool = getConnectionPool(config);
  const [studioRows]: any = await pool.query(`
    SELECT
      id,
      body_pt,
      body_en,
      body_es
    FROM \`studio\`
    ORDER BY id DESC
    LIMIT 1
  `);

  if (studioRows && studioRows.length > 0) {
    const studioRow = studioRows[0] as StudioRow;
    const [rows]: any = await pool.query(`
      SELECT
        sc.id,
        sc.name_pt,
        sc.name_en,
        sc.name_es,
        scm.file_path
      FROM \`studio_category\` sc
        INNER JOIN \`studio_category_media\` scm
          ON sc.id = scm.studio_category_id
      WHERE
        sc.studio_id = ?
      ORDER BY id DESC
    `, [ studioRow.id ]);
    if (rows && rows.length > 0)
      return mapRowToStudio(studioRow, rows as StudioCategoryMediaRow[]);
  }
  return undefined;
}

export async function insertStudioAsync(
  config: DatabaseConfig,
  request: Studio
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1) Insere o STUDIO
    const [studioResult]: any = await connection.query(
      `
        INSERT INTO \`studio\`
          (body_pt, body_en, body_es, created_at, updated_at)
        VALUES
          (?, ?, ?, ?, ?)
      `,
      [bodyPt, bodyEn, bodyEs, now, now]
    );

    if (
      !studioResult ||
      typeof studioResult.affectedRows !== "number" ||
      studioResult.affectedRows === 0
    ) {
      await connection.rollback();
      return false;
    }

    const studioId: number = studioResult.insertId;

    // 2) Insere CATEGORIAS + MÍDIAS
    const categories = Object.values(request.categories ?? {}) as StudioCategory[];

    for (const category of categories) {
      const namePt = category.name?.pt ?? "";
      const nameEn = category.name?.en ?? "";
      const nameEs = category.name?.es ?? "";

      const [categoryResult]: any = await connection.query(
        `
          INSERT INTO \`studio_category\`
            (studio_id, name_pt, name_en, name_es, created_at, updated_at)
          VALUES
            (?, ?, ?, ?, ?, ?)
        `,
        [studioId, namePt, nameEn, nameEs, now, now]
      );

      if (
        !categoryResult ||
        typeof categoryResult.affectedRows !== "number" ||
        categoryResult.affectedRows === 0
      ) {
        await connection.rollback();
        return false;
      }

      const studioCategoryId: number = categoryResult.insertId;

      // Mídias da categoria
      for (const filePath of category.medias ?? []) {
        const [mediaResult]: any = await connection.query(
          `
            INSERT INTO \`studio_category_media\`
              (studio_id, studio_category_id, file_path, created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?)
          `,
          [studioId, studioCategoryId, filePath, now, now]
        );

        if (
          !mediaResult ||
          typeof mediaResult.affectedRows !== "number" ||
          mediaResult.affectedRows === 0
        ) {
          await connection.rollback();
          return false;
        }
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    console.error("Error inserting studio:", error);
    try {
      await connection.rollback();
    } catch {}
    return false;
  } finally {
    connection.release();
  }
}

export async function updateStudioAsync(
  config: DatabaseConfig,
  request: Studio
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  // Descobre qual studio atualizar (o mais recente)
  const [rows]: any = await pool.query(
    `
      SELECT id
      FROM \`studio\`
      ORDER BY id DESC
      LIMIT 1
    `
  );

  const existing = rows && rows.length > 0 ? (rows[0] as { id: number }) : null;

  if (!existing) {
    // Sem registro para atualizar
    return false;
  }

  const studioId = existing.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1) Atualiza o STUDIO
    const [updateResult]: any = await connection.query(
      `
        UPDATE \`studio\`
        SET
          body_pt = ?,
          body_en = ?,
          body_es = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [bodyPt, bodyEn, bodyEs, now, studioId]
    );

    if (
      !updateResult ||
      typeof updateResult.affectedRows !== "number" ||
      updateResult.affectedRows === 0
    ) {
      await connection.rollback();
      return false;
    }

    // 2) Remove mídias antigas do studio
    await connection.query(
      `
        DELETE scm
        FROM \`studio_category_media\` scm
        JOIN \`studio_category\` sc ON sc.id = scm.studio_category_id
        WHERE sc.studio_id = ?
      `,
      [studioId]
    );

    // 3) Remove categorias antigas do studio
    await connection.query(
      `
        DELETE FROM \`studio_category\`
        WHERE studio_id = ?
      `,
      [studioId]
    );

    // 4) Reinsere CATEGORIAS + MÍDIAS com o novo estado
    const categories = Object.values(request.categories ?? {}) as StudioCategory[];

    for (const category of categories) {
      const namePt = category.name?.pt ?? "";
      const nameEn = category.name?.en ?? "";
      const nameEs = category.name?.es ?? "";

      const [categoryResult]: any = await connection.query(
        `
          INSERT INTO \`studio_category\`
            (studio_id, name_pt, name_en, name_es, created_at, updated_at)
          VALUES
            (?, ?, ?, ?, ?, ?)
        `,
        [studioId, namePt, nameEn, nameEs, now, now]
      );

      if (
        !categoryResult ||
        typeof categoryResult.affectedRows !== "number" ||
        categoryResult.affectedRows === 0
      ) {
        await connection.rollback();
        return false;
      }

      const studioCategoryId: number = categoryResult.insertId;

      for (const filePath of category.medias ?? []) {
        const [mediaResult]: any = await connection.query(
          `
            INSERT INTO \`studio_category_media\`
              (studio_id, studio_category_id, file_path, created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?)
          `,
          [studioId, studioCategoryId, filePath, now, now]
        );

        if (
          !mediaResult ||
          typeof mediaResult.affectedRows !== "number" ||
          mediaResult.affectedRows === 0
        ) {
          await connection.rollback();
          return false;
        }
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    console.error("Error updating studio:", error);
    try {
      await connection.rollback();
    } catch {}
    return false;
  } finally {
    connection.release();
  }
}