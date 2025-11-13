import { getConnectionPool } from '@db/connection';
import type { DatabaseConfig } from '@db/types';
import type { Company, CompanyListItem, CompanyRow } from './types';
import { mapRowToCompany } from './mapper';

/** Busca empresa por ID (JOIN com address) */
export async function getCompanyAsync(
  config: DatabaseConfig,
  id: number
): Promise<Company | undefined> {
  const pool = getConnectionPool(config);
  let company: Company | undefined;

  const sql = `
    SELECT
      c.id, c.name, c.slug, c.address_id, a.location_id, a.location_district_id,
      c.active, c.created_at, c.updated_at,
      a.street, a.number, a.complement, a.district,
      a.postal_code, a.latitude, a.longitude
    FROM \`company\` c
    INNER JOIN \`address\` a 
      ON a.id = c.address_id
    WHERE c.id = 4
    LIMIT 1`;

  try {
    const [rows] = await pool.execute(sql, [id]);
    const result = rows as CompanyRow[];
    if (result.length > 0) company = mapRowToCompany(result[0]);
  } catch (e) {
    console.error('Error getting company:', e);
  }
  return company;
}

/**
 * Insere uma nova empresa e um novo endereço.
 */
export async function insertCompanyAsync(
  config: DatabaseConfig,
  company: Company
): Promise<number | undefined> {
  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let companyId: number | undefined;

  try {
    const now = new Date();
    await conn.beginTransaction();

    // 1) Insere novo endereço
    const [addrRes]: any = await conn.execute(
      `
      INSERT INTO \`address\`
        (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        company.address.street,
        company.address.number ?? null,
        company.address.complement ?? null,
        company.address.district ?? null,
        company.address.postal_code ?? null,
        company.address.locationId ?? null,
        company.address.locationDistrictId ?? null,
        company.geo.lat,
        company.geo.lng,
        now,
        now,
      ]
    );

    const addressId: number = addrRes.insertId;

    // 2) Insere empresa
    const [result]: any = await conn.execute(
      `
      INSERT INTO \`company\`
        (name, slug, address_id, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        company.name,
        company.slug?.toLowerCase().trim(),
        addressId,
        company.active ?? true,
        now,
        now,
      ]
    );

    companyId = result.insertId;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error inserting company:', e);
  } finally {
    conn.release();
  }

  return companyId;
}

/**
 * Atualiza uma empresa existente e o seu endereço associado.
 * Não cria novo endereço: edita o já vinculado em company.address_id.
 */
export async function updateCompanyAsync(
  config: DatabaseConfig,
  company: Company
): Promise<boolean> {
  if (!company.id) throw new Error('company.id é obrigatório para update.');

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let success = false;

  try {
    const now = new Date();
    await conn.beginTransaction();

    // 1) Carrega o address_id atual (e garante que a empresa existe)
    const [rows]: any = await conn.execute(
      'SELECT address_id FROM `company` WHERE id = ? FOR UPDATE',
      [company.id]
    );
    if (!rows || rows.length === 0) {
      throw new Error(`Empresa id=${company.id} não encontrada.`);
    }
    const addressId: number = rows[0].address_id;

    // 2) Atualiza COMPANY
    const [compRes]: any = await conn.execute(
      `
      UPDATE \`company\`
      SET
        name = ?,
        slug = ?,
        address_id = ?,
        active = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        company.name,
        company.slug?.toLowerCase().trim(),
        addressId,
        company.active ?? true,
        now,
        company.id,
      ]
    );

    // 3) Atualiza ADDRESS
    const [addrRes]: any = await conn.execute(
      `
      UPDATE \`address\`
      SET
        street = ?,
        number = ?,
        complement = ?,
        district = ?,
        postal_code = ?,
        location_id = ?,
        location_district_id = ?,
        latitude = ?,
        longitude = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        company.address.street,
        company.address.number ?? null,
        company.address.complement ?? null,
        company.address.district ?? null,
        company.address.postal_code ?? null,
        company.address.locationId ?? null,
        company.address.locationDistrictId ?? null,
        company.geo.lat,
        company.geo.lng,
        now,
        addressId,
      ]
    );

    success = compRes.affectedRows >= 0 && addrRes.affectedRows >= 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error updating company and address:', e);
  } finally {
    conn.release();
  }

  return success;
}

export async function updateCompanyActiveAsync(
  config: DatabaseConfig,
  companyId: number,
  active: boolean
): Promise<boolean> {
  if (typeof companyId !== 'number' || companyId <= 0) {
    throw new Error('companyId é obrigatório e deve ser um número válido.');
  }

  const pool = getConnectionPool(config);
  const conn = await pool.getConnection();
  let success = false;

  try {
    const now = new Date();
    await conn.beginTransaction();
    const [result]: any = await conn.execute(
      `
      UPDATE \`company\`
      SET active = ?, updated_at = ?
      WHERE id = ?
      `,
      [active, now, companyId]
    );

    success = result.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error updating company active status:', e);
  } finally {
    conn.release();
  }
  return success;
}

function escapeLikeTermRaw(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function listCompaniesAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  name?: string | null
): Promise<CompanyListItem[]> {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('skip inválido — deve ser inteiro >= 0');
  }
  if (!Number.isInteger(take) || take <= 0) {
    throw new Error('take inválido — deve ser inteiro > 0');
  }
  const MAX_TAKE = 500;
  const safeTake = Math.min(take, MAX_TAKE);

  const pool = getConnectionPool(config);
  // para montar cláusulas com escape, podemos usar o escape do próprio pool
  const esc = (v: any) => (pool as any).escape(v);

  let whereClause = '';
  if (name && name.trim() !== '') {
    const raw = escapeLikeTermRaw(name.trim());
    const likeWithPercents = `%${raw}%`;
    const escapedLike = esc(likeWithPercents);
    whereClause = `WHERE name LIKE ${escapedLike} ESCAPE '\\'`;
  }

  const escapedOffset = esc(skip);
  const escapedRowCount = esc(safeTake);

  const sql = `
    SELECT id, name, slug, active
    FROM \`company\`
    ${whereClause}
    ORDER BY name ASC, id ASC
    LIMIT ${escapedOffset}, ${escapedRowCount}
  `;

  const [rows]: any = await pool.query(sql);

  return (rows || []).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    slug: r.slug,
    active: !!r.active,
  }));
}