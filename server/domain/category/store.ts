// store.ts

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import type { Category, CategoryListItem, CategoryRow } from "./types";
import { mapRowToCategory } from "./mapper";

/**
 * Escapa caracteres especiais para uso em LIKE com ESCAPE '\'
 */
function escapeLikeTermRaw(term: string): string {
  return term
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Busca categoria por ID
 */
export async function getCategoryAsync(
  config: DatabaseConfig,
  id: number
): Promise<Category | undefined> {
  const pool = getConnectionPool(config);
  let category: Category | undefined;

  const sql = `
    SELECT
      id,
      name_pt, name_en, name_es,
      slug_pt, slug_en, slug_es,
      description_pt, description_en, description_es,
      active,
      created_at,
      updated_at
    FROM \`category\`
    WHERE id = ?
    LIMIT 1
  `;

  try {
    const [rows] = await pool.execute(sql, [id]);
    const result = rows as CategoryRow[];

    if (result.length > 0) {
      category = mapRowToCategory(result[0]);
    }
  } catch (e) {
    console.error("Error getting category:", e);
  }

  return category;
}

/**
 * Insere uma nova categoria
 */
export async function insertCategoryAsync(
  config: DatabaseConfig,
  category: Category
): Promise<number | undefined> {
  const pool = getConnectionPool(config);
  let categoryId: number | undefined;

  const now = new Date();

  const sql = `
    INSERT INTO \`category\`
      (
        name_pt, name_en, name_es,
        slug_pt, slug_en, slug_es,
        description_pt, description_en, description_es,
        active,
        created_at, updated_at
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result]: any = await pool.execute(sql, [
      category.name.pt,
      category.name.en,
      category.name.es,

      category.slug.pt.toLowerCase().trim(),
      category.slug.en.toLowerCase().trim(),
      category.slug.es.toLowerCase().trim(),

      category.description?.pt ?? null,
      category.description?.en ?? null,
      category.description?.es ?? null,

      category.active ?? true,
      now,
      now,
    ]);

    categoryId = result.insertId;
  } catch (e) {
    console.error("Error inserting category:", e);
  }

  return categoryId;
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategoryAsync(
  config: DatabaseConfig,
  category: Category
): Promise<boolean> {
  if (!category.id) {
    throw new Error("category.id é obrigatório para update.");
  }

  const pool = getConnectionPool(config);
  const now = new Date();
  let success = false;

  const sql = `
    UPDATE \`category\`
    SET
      name_pt = ?,
      name_en = ?,
      name_es = ?,
      slug_pt = ?,
      slug_en = ?,
      slug_es = ?,
      description_pt = ?,
      description_en = ?,
      description_es = ?,
      active = ?,
      updated_at = ?
    WHERE id = ?
  `;

  try {
    const [result]: any = await pool.execute(sql, [
      category.name.pt,
      category.name.en,
      category.name.es,

      category.slug.pt.toLowerCase().trim(),
      category.slug.en.toLowerCase().trim(),
      category.slug.es.toLowerCase().trim(),

      category.description?.pt ?? null,
      category.description?.en ?? null,
      category.description?.es ?? null,

      category.active,
      now,
      category.id,
    ]);

    success = result.affectedRows > 0;
  } catch (e) {
    console.error("Error updating category:", e);
  }

  return success;
}

/**
 * Atualiza apenas o campo active da categoria
 */
export async function updateCategoryActiveAsync(
  config: DatabaseConfig,
  categoryId: number,
  active: boolean
): Promise<boolean> {
  if (typeof categoryId !== "number" || categoryId <= 0) {
    throw new Error("categoryId é obrigatório e deve ser um número válido.");
  }

  const pool = getConnectionPool(config);
  const now = new Date();
  let success = false;

  const sql = `
    UPDATE \`category\`
    SET active = ?, updated_at = ?
    WHERE id = ?
  `;

  try {
    const [result]: any = await pool.execute(sql, [active, now, categoryId]);
    success = result.affectedRows > 0;
  } catch (e) {
    console.error("Error updating category active status:", e);
  }

  return success;
}

/**
 * Lista categorias com paginação e filtro opcional por nome_pt
 */
export async function listCategoriesAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  name?: string | null
): Promise<CategoryListItem[]> {
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
  if (name && name.trim() !== "") {
    const raw = escapeLikeTermRaw(name.trim());
    const likeWithPercents = `%${raw}%`;
    const escapedLike = esc(likeWithPercents);
    // filtrando por name_pt; se quiser, pode expandir para OR em name_en/name_es
    whereClause = `WHERE name_pt LIKE ${escapedLike} ESCAPE '!'`;
  }

  const escapedOffset = esc(skip);
  const escapedRowCount = esc(safeTake);

  const sql = `
    SELECT id, name_pt, slug_pt, active
    FROM \`category\`
    ${whereClause}
    ORDER BY name_pt ASC, id ASC
    LIMIT ${escapedOffset}, ${escapedRowCount}
  `;

  const [rows]: any = await pool.query(sql);

  return (rows || []).map((r: any) => ({
    id: String(r.id),
    name_pt: r.name_pt,
    slug_pt: r.slug_pt,
    active: !!r.active,
  }));
}