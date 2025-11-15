import { getConnectionPool } from "@db/connection";
import type { DatabaseConfig } from "@db/types";
import { Event, EventRow, EventListItem } from "./types";
import { mapRowToEvent, mapRowToEventListItem } from "./mapper";

/**
 * Busca um Event por id
 */
export async function getEventAsync(
  config: DatabaseConfig,
  id: number
): Promise<Event | undefined> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      e.id,
      e.category_id          AS category_id,
      e.company_id           AS company_id,
      e.title_pt             AS title_pt,
      e.title_en             AS title_en,
      e.title_es             AS title_es,
      e.slug_pt              AS slug_pt,
      e.slug_en              AS slug_en,
      e.slug_es              AS slug_es,
      e.body_pt              AS body_pt,
      e.body_en              AS body_en,
      e.body_es              AS body_es,
      e.hero_image           AS hero_image,
      e.thumbnail            AS thumbnail,
      e.start_date           AS start_date,
      e.end_date             AS end_date,
      e.pricing              AS pricing,
      e.external_ticket_link AS external_ticket_link,
      e.active               AS active,
      e.created_at           AS created_at,
      e.updated_at           AS updated_at
    FROM \`event\` e
    WHERE e.id = ?
    LIMIT 1
  `;

  const [rows]: any = await pool.query(sql, [id]);

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const row = rows[0] as EventRow;
  return mapRowToEvent(row);
}

/**
 * Insere um novo Event
 */
export async function insertEventAsync(
  config: DatabaseConfig,
  request: Event
): Promise<boolean> {
  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();

  let success = false;
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

  const categoryId = (request as any).categoryId ?? null;
  const companyId = (request as any).companyId ?? null;

  const heroImage = request.heroImage ?? "";
  const thumbnail = request.thumbnail ?? "";

  const startDate = request.startDate ?? now;
  const endDate = request.endDate ?? now;

  const pricing = request.pricing ?? 0;
  const externalTicketLink = request.externalTicketLink ?? null;

  const active =
    typeof request.active === "boolean" ? request.active : true;

  try {
    await conn.beginTransaction();

    const [result]: any = await conn.execute(
      `
        INSERT INTO \`event\`
          (
            category_id,
            company_id,
            title_pt,
            title_en,
            title_es,
            slug_pt,
            slug_en,
            slug_es,
            body_pt,
            body_en,
            body_es,
            hero_image,
            thumbnail,
            start_date,
            end_date,
            pricing,
            external_ticket_link,
            active,
            created_at,
            updated_at
          )
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        categoryId,
        companyId,
        titlePt,
        titleEn,
        titleEs,
        slugPt,
        slugEn,
        slugEs,
        bodyPt,
        bodyEn,
        bodyEs,
        heroImage,
        thumbnail,
        startDate,
        endDate,
        pricing,
        externalTicketLink,
        active,
        now,
        now,
      ]
    );

    const eventId: number | undefined =
      result && typeof result.insertId === "number"
        ? result.insertId
        : undefined;

    if (!eventId) {
      throw new Error("Falha ao obter insertId para Event.");
    }

    // 👉 Aqui você pode futuramente escrever:
    // - facilities em event_facility
    // - recurrence em event_recurrence
    // - sponsoredPeriods em event_sponsored
    // - occurrences em event_occurrence
    //
    // Exemplo: await writeEventDetailsAsync(conn, eventId, request);

    await conn.commit();
    success = true;
  } catch (e) {
    await conn.rollback();
    console.error("Error inserting Event:", e);
  } finally {
    conn.release();
  }

  return success;
}

/**
 * Atualiza um Event existente
 */
export async function updateEventAsync(
  config: DatabaseConfig,
  request: Event
): Promise<boolean> {
  if (!Number.isInteger(request.id) || request.id <= 0) {
    throw new Error("id inválido para updateEventAsync.");
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();

  let success = false;
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

  const categoryId = (request as any).categoryId ?? null;
  const companyId = (request as any).companyId ?? null;

  const heroImage = request.heroImage ?? "";
  const thumbnail = request.thumbnail ?? "";

  const startDate = request.startDate ?? now;
  const endDate = request.endDate ?? now;

  const pricing = request.pricing ?? 0;
  const externalTicketLink = request.externalTicketLink ?? null;

  const active =
    typeof request.active === "boolean" ? request.active : true;

  try {
    await conn.beginTransaction();

    const [result]: any = await conn.execute(
      `
        UPDATE \`event\`
        SET
          category_id          = ?,
          company_id           = ?,
          title_pt             = ?,
          title_en             = ?,
          title_es             = ?,
          slug_pt              = ?,
          slug_en              = ?,
          slug_es              = ?,
          body_pt              = ?,
          body_en              = ?,
          body_es              = ?,
          hero_image           = ?,
          thumbnail            = ?,
          start_date           = ?,
          end_date             = ?,
          pricing              = ?,
          external_ticket_link = ?,
          active               = ?,
          updated_at           = ?
        WHERE id = ?
      `,
      [
        categoryId,
        companyId,
        titlePt,
        titleEn,
        titleEs,
        slugPt,
        slugEn,
        slugEs,
        bodyPt,
        bodyEn,
        bodyEs,
        heroImage,
        thumbnail,
        startDate,
        endDate,
        pricing,
        externalTicketLink,
        active,
        now,
        request.id,
      ]
    );

    if (!result || result.affectedRows <= 0) {
      await conn.rollback();
      return false;
    }

    // 👉 Se você tiver tabelas relacionadas (event_facility, event_recurrence, etc.),
    // aqui é o lugar de:
    //
    // - limpar registros antigos
    // - regravar os atuais com base em `request`
    //
    // Ex:
    // await conn.execute("DELETE FROM `event_facility` WHERE event_id = ?", [request.id]);
    // await writeEventDetailsAsync(conn, request.id, request);

    await conn.commit();
    success = true;
  } catch (e) {
    await conn.rollback();
    console.error("Error updating Event:", e);
  } finally {
    conn.release();
  }

  return success;
}

/**
 * Atualiza apenas o campo `active`
 */
export async function updateEventActiveAsync(
  config: DatabaseConfig,
  eventId: number,
  active: boolean
): Promise<boolean> {
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("eventId inválido.");
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let success = false;

  const sql = `
    UPDATE \`event\`
    SET \`active\` = ?, \`updated_at\` = ?
    WHERE \`id\` = ?
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();
    const [res]: any = await conn.execute(sql, [active, now, eventId]);
    success = res.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error("Error updating Event active status:", e);
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
 * Lista Events com filtro opcional por título (em pt)
 */
export async function listEventsAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  title?: string | null
): Promise<EventListItem[]> {
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
      WHERE e.title_pt LIKE ${escapedLike} ESCAPE '!'
    `;
  }

  const escapedOffset = esc(skip);
  const escapedRowCount = esc(safeTake);

  const sql = `
    SELECT
      e.id,
      e.title_pt     AS title_pt,
      e.start_date   AS start_date,
      e.end_date     AS end_date,
      e.active       AS active
    FROM \`event\` e
    ${whereClause}
    ORDER BY e.start_date DESC, e.id DESC
    LIMIT ${escapedOffset}, ${escapedRowCount}
  `;

  const [rows]: any = await pool.query(sql);

  return (rows || []).map((r: EventRow) => mapRowToEventListItem(r));
}
