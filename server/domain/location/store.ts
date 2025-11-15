import { getConnectionPool } from '@db/connection';
import type { DatabaseConfig } from '@db/types';
import type {
  Location,
  LocationDistrict,
  LocationDistrictRow,
  LocationListItem,
  LocationRow
} from './types';
import { mapLocationRowToLocation, mapRowToLocationDistrict } from './mapper';
import { Pool } from 'mysql2/promise';

let _sharedPool: Pool | undefined;

function getSharedPool(config: DatabaseConfig): Pool {
  if (!_sharedPool) {
    _sharedPool = getConnectionPool(config);
  }
  return _sharedPool;
}

export async function getLocationAsync(
  config: DatabaseConfig,
  id: number
): Promise<Location | undefined> {
  const sql = `
    SELECT
      l.id, l.city_id, s.id as state_id, co.id as country_id, l.description, l.active, l.created_at, l.updated_at
    FROM \`location\` l
      INNER JOIN \`city\` c    ON l.city_id = c.id
      INNER JOIN \`state\` s    ON s.id = c.state_id
      INNER JOIN \`country\` co ON co.id = s.country_id
    WHERE l.id = ?
    LIMIT 1
  `;
  const pool = getSharedPool(config);
  const [rows]: any = await pool.execute(sql, [id]);
  const result = rows as LocationRow[];
  if (!result || result.length === 0) return undefined;

  return mapLocationRowToLocation(result[0]);
}

export async function getLocationWithDistrictsAsync(
  config: DatabaseConfig,
  id: number
): Promise<Location | undefined> {
  const pool = getSharedPool(config);

  // ✅ Reaproveita o mesmo pool e passa ele pro getLocationAsync
  const location = await getLocationAsync(config, id);
  if (!location) return undefined;

  const sqlDistricts = `
    SELECT \`id\`, \`location_id\`, \`district\`, \`slug\`
    FROM \`location_district\`
    WHERE \`location_id\` = ?
    ORDER BY \`district\` ASC, \`id\` ASC
  `;
  const [distRows]: any = await pool.execute(sqlDistricts, [id]);
  location.districts = (distRows as LocationDistrictRow[]).map(mapRowToLocationDistrict);

  return location;
}


/** Insere uma Location e seus districts (em batch) */
export async function insertLocationAsync(
  config: DatabaseConfig,
  location: Location
): Promise<number | undefined> {
  const pool = getSharedPool(config);
  const conn = await pool.getConnection();
  let newId: number | undefined;

  const sqlInsertLocation = `
    INSERT INTO \`location\`
      (\`city_id\`, \`description\`, \`active\`, \`created_at\`, \`updated_at\`)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();

    // 1. Inserir location
    const [res]: any = await conn.execute(sqlInsertLocation, [
      location.cityId,
      location.description,
      location.active ?? true,
      now,
      now,
    ]);

    newId = Number(res.insertId);

    // 2. Inserir distritos (em batch)
    if (newId && Array.isArray(location.districts) && location.districts.length > 0) {
      const values = location.districts
        .map((d: LocationDistrict) =>
          `(${conn.escape(newId)}, ${conn.escape(d.district)}, ${conn.escape(d.slug)})`
        )
        .join(', ');

      const sqlInsertDistricts = `
        INSERT INTO \`location_district\` (\`location_id\`, \`district\`, \`slug\`)
        VALUES ${values}
      `;
      await conn.query(sqlInsertDistricts);
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error inserting location (with districts):', e);
    newId = undefined;
  } finally {
    conn.release();
  }

  return newId;
}

/** Atualiza uma Location existente e substitui distritos, se fornecidos */
export async function updateLocationAsync(
  config: DatabaseConfig,
  location: Location
): Promise<boolean> {
  if (!location.id) throw new Error('location.id is required for update.');

  const pool = getSharedPool(config);
  const conn = await pool.getConnection();
  let success = false;

  const sqlUpdateLocation = `
    UPDATE \`location\`
    SET
      \`city_id\` = ?,
      \`description\` = ?,
      \`active\` = ?,
      \`updated_at\` = ?
    WHERE \`id\` = ?
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();

    // 1. Atualizar location
    const [resUpd]: any = await conn.execute(sqlUpdateLocation, [
      location.cityId,
      location.description,
      location.active ?? true,
      now,
      location.id,
    ]);

    // 2. Substituir distritos (DELETE + INSERT em batch) se fornecidos
    if (Array.isArray(location.districts)) {
      await conn.execute(
        'DELETE FROM `location_district` WHERE `location_id` = ?',
        [location.id]
      );

      if (location.districts.length > 0) {
        const values = location.districts
          .map((d: LocationDistrict) =>
            `(${conn.escape(location.id)}, ${conn.escape(d.district)}, ${conn.escape(d.slug)})`
          )
          .join(', ');

        const sqlInsertDistricts = `
          INSERT INTO \`location_district\` (\`location_id\`, \`district\`, \`slug\`)
          VALUES ${values}
        `;
        await conn.query(sqlInsertDistricts);
      }
    }

    success = resUpd.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error updating location (with districts batch replace):', e);
  } finally {
    conn.release();
  }

  return success;
}

/** Ativa/Desativa uma Location */
export async function updateLocationActiveAsync(
  config: DatabaseConfig,
  locationId: number,
  active: boolean
): Promise<boolean> {
  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw new Error('locationId inválido.');
  }

  const pool = getSharedPool(config);
  const conn = await pool.getConnection();
  let success = false;

  const sql = `
    UPDATE \`location\`
    SET \`active\` = ?, \`updated_at\` = ?
    WHERE \`id\` = ?
  `;

  try {
    const now = new Date();
    await conn.beginTransaction();
    const [res]: any = await conn.execute(sql, [active, now, locationId]);
    success = res.affectedRows > 0;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error updating location active status:', e);
  } finally {
    conn.release();
  }

  return success;
}

// helper: sem replaceAll
function replaceAllSimple(s: string, find: string, replacement: string) {
  return s.split(find).join(replacement);
}

// monta o padrão para LIKE escapando %, _ e o próprio caractere de escape
function makeLikePattern(term: string, esc = '!') {
  let out = term;
  out = replaceAllSimple(out, esc, esc + esc); // escapa '!'
  out = replaceAllSimple(out, '%', esc + '%'); // %  -> !%
  out = replaceAllSimple(out, '_', esc + '_'); // _  -> !_
  return `%${out}%`;
}

/** Lista Locations com paginação e filtro opcional por 'city' (LIKE em city.name) */
export async function listLocationsAsync(
  config: DatabaseConfig,
  skip: number,
  take: number,
  city?: string | null
): Promise<LocationListItem[]> {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('skip inválido — deve ser inteiro >= 0');
  }
  if (!Number.isInteger(take) || take <= 0) {
    throw new Error('take inválido — deve ser inteiro > 0');
  }

  const MAX_TAKE = 500;
  const safeTake = Math.min(take, MAX_TAKE);

  const pool = getSharedPool(config);

  const params: any[] = [];
  let whereClause = '';

  if (city && city.trim() !== '') {
    const likeParam = makeLikePattern(city.trim(), '!');
    whereClause = `WHERE c.\`name\` LIKE ? ESCAPE '!'`;
    params.push(likeParam);
  }

  // LIMIT com valores validados (único injection pedido)
  const sql = `
    SELECT
      l.\`id\`,
      co.\`name\`  AS \`country\`,
      s.\`name\`   AS \`state\`,
      c.\`name\`   AS \`city\`,
      l.\`active\`
    FROM \`location\` l
    JOIN \`city\` c     ON c.\`id\` = l.\`city_id\`
    JOIN \`state\` s    ON s.\`id\` = c.\`state_id\`
    JOIN \`country\` co ON co.\`id\` = s.\`country_id\`
    ${whereClause}
    ORDER BY c.\`name\` ASC, l.\`id\` ASC
    LIMIT ${skip}, ${safeTake};
  `;

  const [rows]: any = await pool.query(sql, params);

  return (rows || []).map((r: any) => ({
    id: Number(r.id),
    country: r.country,
    state: r.state,
    city: r.city,
    active: !!r.active,
  })) as LocationListItem[];
}