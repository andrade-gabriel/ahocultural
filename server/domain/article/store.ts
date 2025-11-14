// store.ts (article)

import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import type { Article, ArticleListItem, ArticleRow } from "./types";
import { mapRowToArticle, mapRowToArticleListItem } from "./mapper";

/**
 * Busca o registro mais recente de "article" no banco.
 * Caso não exista nenhum registro, retorna undefined.
 */
export async function getArticleAsync(
  config: DatabaseConfig,
  id: number
): Promise<Article | undefined> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      id,
      title_pt,
      title_en,
      title_es,
      slug_pt,
      slug_en,
      slug_es,
      hero_image AS heroImage,
      thumbnail,
      body_pt,
      body_en,
      body_es,
      publication_date AS publicationDate,
      active,
      created_at,
      updated_at
    FROM \`article\`
    WHERE 
        id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql, [id]);

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const row = rows[0] as ArticleRow;
  return mapRowToArticle(row);
}

/**
 * Insere um novo registro de Article.
 */
export async function insertArticleAsync(
  config: DatabaseConfig,
  request: Article
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const titlePt = request.title?.pt ?? "";
  const titleEn = request.title?.en ?? "";
  const titleEs = request.title?.es ?? "";

  const slugPt = request.slug?.pt ?? "";
  const slugEn = request.slug?.en ?? "";
  const slugEs = request.slug?.es ?? "";

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  const heroImage = request.heroImage ?? "";
  const thumbnail = request.thumbnail ?? "";

  const publicationDate = request.publicationDate ?? now;
  const active =
    typeof request.active === "boolean" ? request.active : true;

  const [result]: any = await pool.query(
    `
      INSERT INTO \`article\`
        (
          title_pt,
          title_en,
          title_es,
          slug_pt,
          slug_en,
          slug_es,
          hero_image,
          thumbnail,
          body_pt,
          body_en,
          body_es,
          publication_date,
          active,
          created_at,
          updated_at
        )
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      titlePt,
      titleEn,
      titleEs,
      slugPt,
      slugEn,
      slugEs,
      heroImage,
      thumbnail,
      bodyPt,
      bodyEn,
      bodyEs,
      publicationDate,
      active,
      now,
      now,
    ]
  );

  return (
    !!result &&
    typeof result.affectedRows === "number" &&
    result.affectedRows > 0
  );
}

/**
 * Atualiza o registro mais recente de Article.
 * Caso não exista nenhum registro, retorna false.
 */
export async function updateArticleAsync(
  config: DatabaseConfig,
  request: Article
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const now = new Date();

  const titlePt = request.title?.pt ?? "";
  const titleEn = request.title?.en ?? "";
  const titleEs = request.title?.es ?? "";

  const slugPt = request.slug?.pt ?? "";
  const slugEn = request.slug?.en ?? "";
  const slugEs = request.slug?.es ?? "";

  const bodyPt = request.body?.pt ?? "";
  const bodyEn = request.body?.en ?? "";
  const bodyEs = request.body?.es ?? "";

  const heroImage = request.heroImage ?? "";
  const thumbnail = request.thumbnail ?? "";

  const publicationDate = request.publicationDate ?? now;
  const active =
    typeof request.active === "boolean" ? request.active : true;

  // Busca o último registro (mesma lógica que o upsert antigo)
  const [rows]: any = await pool.query(
    `
      SELECT id
      FROM \`article\`
      ORDER BY id DESC
      LIMIT 1
    `
  );

  const existing =
    rows && rows.length > 0 ? (rows[0] as { id: number }) : null;

  if (!existing) {
    // Sem registro para atualizar
    return false;
  }

  const [result]: any = await pool.query(
    `
      UPDATE \`article\`
      SET
        title_pt = ?,
        title_en = ?,
        title_es = ?,
        slug_pt = ?,
        slug_en = ?,
        slug_es = ?,
        hero_image = ?,
        thumbnail = ?,
        body_pt = ?,
        body_en = ?,
        body_es = ?,
        publication_date = ?,
        active = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [
      titlePt,
      titleEn,
      titleEs,
      slugPt,
      slugEn,
      slugEs,
      heroImage,
      thumbnail,
      bodyPt,
      bodyEn,
      bodyEs,
      publicationDate,
      active,
      now,
      existing.id,
    ]
  );

  return (
    !!result &&
    typeof result.affectedRows === "number" &&
    result.affectedRows > 0
  );
}

export async function updateArticleActiveAsync(
  config: DatabaseConfig,
  articleId: number,
  active: boolean
): Promise<boolean> {
  if (!Number.isInteger(articleId) || articleId <= 0) {
    throw new Error('articleId inválido.');
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let success = false;

  const sql = `
    UPDATE \`article\`
    SET \`active\` = ?, \`updated_at\` = ?
    WHERE \`id\` = ?
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();
    const [res]: any = await conn.execute(sql, [active, now, articleId]);
    success = res.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error updating article active status:', e);
  } finally {
    conn.release();
  }

  return success;
}

function escapeLikeTermRaw(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function listArticlesAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  title?: string | null
): Promise<ArticleListItem[]> {
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

    // filtra por qualquer um dos títulos (pt/en/es)
    whereClause = `
      WHERE (
        title_pt LIKE ${escapedLike}
        OR title_en LIKE ${escapedLike}
        OR title_es LIKE ${escapedLike}
      ) ESCAPE '\\'
    `;
  }

  const escapedOffset = esc(skip);
  const escapedRowCount = esc(safeTake);

  const sql = `
    SELECT
      id,
      title_pt,
      slug_pt,
      publication_date,
      active
    FROM \`article\`
    ${whereClause}
    ORDER BY publication_date DESC, id DESC
    LIMIT ${escapedOffset}, ${escapedRowCount}
  `;

  const [rows]: any = await pool.query(sql);

  return (rows || []).map((r: ArticleRow) => mapRowToArticleListItem(r));
}