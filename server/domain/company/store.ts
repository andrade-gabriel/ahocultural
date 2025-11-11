import { createConnection } from '@db/connection';
import type { DatabaseConfig } from '@db/types';
import type { Company, CompanyListItem, CompanyRow } from './types';
import { mapRowToCompany } from './mapper';

/** Busca empresa por ID (JOIN com address) */
export async function getCompanyAsync(
    config: DatabaseConfig,
    id: number
): Promise<Company | undefined> {
    const conn = await createConnection(config);
    let company: Company | undefined = undefined;

    try {
        const sql = `
      SELECT
        c.id, c.name, c.slug, c.address_id, c.location_id, c.location_district_id,
        c.active, c.created_at, c.updated_at,
        a.street, a.number, a.complement, a.district, a.city, a.state,
        a.postal_code, a.country, a.country_code, a.latitude, a.longitude
      FROM \`company\` c
      JOIN \`address\` a ON a.id = c.address_id
      WHERE c.id = ?
      LIMIT 1`;

        const [rows] = await conn.execute(sql, [id]);
        const result = rows as CompanyRow[];
        if (result.length > 0) {
            company = mapRowToCompany(result[0]);
        }
    } catch (e) {
        console.error('Error getting company:', e);
    } finally {
        await conn.end();
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
    const conn = await createConnection(config);
    let companyId: number | undefined;

    try {
        const now = new Date();
        await conn.beginTransaction();

        // 1) Insere novo endereço
        const [addrRes]: any = await conn.execute(
            `
      INSERT INTO \`address\`
        (street, number, complement, district, city, state, postal_code,
         country, country_code, latitude, longitude, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                company.address.street,
                company.address.number ?? null,
                company.address.complement ?? null,
                company.address.district ?? null,
                company.address.city,
                company.address.state,
                company.address.postal_code ?? null,
                company.address.country,
                company.address.country_code,
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
        (name, slug, address_id, location_id, location_district_id, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                company.name,
                company.slug?.toLowerCase().trim(),
                addressId,
                company.locationId,
                company.locationDistrictId,
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
        await conn.end();
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
    if (!company.id) {
        throw new Error('company.id é obrigatório para update.');
    }

    const conn = await createConnection(config);
    let success = false;

    try {
        const now = new Date();
        await conn.beginTransaction();

        // 1) Carrega o address_id atual da empresa (e garante que a empresa existe)
        const [rows]: any = await conn.execute(
            'SELECT address_id FROM `company` WHERE id = ? FOR UPDATE',
            [company.id]
        );

        if (!rows || rows.length === 0) {
            throw new Error(`Empresa id=${company.id} não encontrada.`);
        }
        const addressId: number = rows[0].address_id;

        // 2) Atualiza COMPANY (campos editáveis)
        const [compRes]: any = await conn.execute(
            `
      UPDATE \`company\`
      SET
        name = ?,
        slug = ?,
        location_id = ?,
        location_district_id = ?,
        active = ?,
        updated_at = ?
      WHERE id = ?
      `,
            [
                company.name,
                company.slug?.toLowerCase().trim(),
                company.locationId,
                company.locationDistrictId,
                company.active ?? true,
                now,
                company.id,
            ]
        );

        // 3) Atualiza ADDRESS vinculado
        const [addrRes]: any = await conn.execute(
            `
      UPDATE \`address\`
      SET
        street = ?,
        number = ?,
        complement = ?,
        district = ?,
        city = ?,
        state = ?,
        postal_code = ?,
        country = ?,
        country_code = ?,
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
                company.address.city,
                company.address.state,
                company.address.postal_code ?? null,
                company.address.country,
                company.address.country_code,
                company.geo.lat,
                company.geo.lng,
                now,
                addressId,
            ]
        );

        // Se a empresa existia, consideramos sucesso (mesmo que não haja mudança de valores)
        success = compRes.affectedRows >= 0 && addrRes.affectedRows >= 0;

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        console.error('Error updating company and address:', e);
    } finally {
        await conn.end();
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

    const conn = await createConnection(config);
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
        await conn.end();
    }
    return success;
}

function escapeLikeTermRaw(term: string): string {
  // escape backslash first
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function listCompaniesAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  name?: string | null
): Promise<CompanyListItem[]> {
  // validação rígida
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('skip inválido — deve ser inteiro >= 0');
  }
  if (!Number.isInteger(take) || take <= 0) {
    throw new Error('take inválido — deve ser inteiro > 0');
  }
  const MAX_TAKE = 500;
  const safeTake = Math.min(take, MAX_TAKE);

  const conn = await createConnection(config);

  try {
    // usamos o escape do próprio connection para garantir compatibilidade com o driver
    // conn.escape(value) -> string segura pronta para interpolação
    let whereClause = '';
    if (name && name.trim() !== '') {
      const raw = escapeLikeTermRaw(name.trim());
      const likeWithPercents = `%${raw}%`;
      // conn.escape adiciona aspas, por ex: "'%termo%'" e faz escaping apropriado
      const escapedLike = conn.escape(likeWithPercents);
      // Importante: definimos ESCAPE '\' se sua collation usar isso como padrão (opcional)
      whereClause = `WHERE name LIKE ${escapedLike} ESCAPE '\\'`;
    }

    // escape de números com conn.escape também é seguro — garante que algo malformado vire '0' ou seja escapado
    // porém fazemos validação acima; aqui apenas convertemos e escapamos
    const escapedOffset = conn.escape(skip);      // ex:  '0'
    const escapedRowCount = conn.escape(safeTake); // ex: '10'

    const sql = `
      SELECT id, name, slug, active
      FROM \`company\`
      ${whereClause}
      ORDER BY name ASC, id ASC
      LIMIT ${escapedOffset}, ${escapedRowCount}
    `;

    // Como tudo já foi escapado, podemos executar sem parâmetros
    const [rows]: any = await conn.query(sql);

    return (rows || []).map((r: any) => ({
      id: String(r.id),
      name: r.name,
      slug: r.slug,
      active: !!r.active,
    }));
  } finally {
    await conn.end();
  }
}