import { DatabaseConfig } from "@db/types";
import { City, CityRow, Country, CountryRow, State, StateRow } from "./types";
import { getConnectionPool } from "@db/connection";
import { mapCityRow, mapCountryRow, mapStateRow } from "./mapper";

export async function listCountriesAsync(
  config: DatabaseConfig
): Promise<Country[]> {
  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      \`id\`, \`name\`, \`iso2\`, \`slug\`,
      \`created_at\`, \`updated_at\`
    FROM \`country\`
    ORDER BY \`name\` ASC, \`id\` ASC
  `;

  const [rows]: any = await pool.query(sql);
  return (rows as CountryRow[]).map(mapCountryRow);
}

export async function listStatesByCountryAsync(
  config: DatabaseConfig,
  countryId: number
): Promise<State[]> {
  if (!Number.isInteger(countryId) || countryId <= 0) {
    throw new Error('countryId must be a positive integer.');
  }

  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      \`id\`, \`country_id\`, \`name\`, \`uf\`, \`slug\`,
      \`created_at\`, \`updated_at\`
    FROM \`state\`
    WHERE \`country_id\` = ?
    ORDER BY \`name\` ASC, \`id\` ASC
  `;

  const [rows]: any = await pool.execute(sql, [countryId]);
  return (rows as StateRow[]).map(mapStateRow);
}

export async function listCitiesByStateAsync(
  config: DatabaseConfig,
  stateId: number
): Promise<City[]> {
  if (!Number.isInteger(stateId) || stateId <= 0) {
    throw new Error('stateId must be a positive integer.');
  }

  const pool = getConnectionPool(config);

  const sql = `
    SELECT
      \`id\`, \`state_id\`, \`name\`, \`slug\`,
      \`created_at\`, \`updated_at\`
    FROM \`city\`
    WHERE \`state_id\` = ?
    ORDER BY \`name\` ASC, \`id\` ASC
  `;

  const [rows]: any = await pool.execute(sql, [stateId]);
  return (rows as CityRow[]).map(mapCityRow);
}