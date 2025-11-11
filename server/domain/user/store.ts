import type { UserEntity } from "./types";
import { createConnection } from "@db/connection";
import { DatabaseConfig } from "@db/types";

const mapRowToUser = (row: any): UserEntity => ({
    email: row.email ?? '',
    firstName: row.first_name ?? '',
    password: row.password ?? '',
    active: !!row.active,
    createdAt: new Date(row.created_at ?? new Date()),
    updatedAt: new Date(row.updated_at ?? new Date()),
});

export async function getUserAsync(config: DatabaseConfig, email: string): Promise<UserEntity | undefined> {
    const conn = await createConnection(config);
    let user: UserEntity | undefined = undefined;

    try {
        const [rows] = await conn.execute(
            `
      SELECT email, first_name, password, active, created_at, updated_at
      FROM \`user\`
      WHERE email = ?
      LIMIT 1
      `,
            [email.toLowerCase().trim()]
        );

        const result = rows as any[];
        if (result.length > 0) {
            user = mapRowToUser(result[0]);
        }
    } catch (e) {
        console.log(`Error getting user: ${e}`);
    } finally {
        await conn.end();
    }
    return user;
}

export async function saveUserAsync(
  config: DatabaseConfig,
  user: UserEntity
): Promise<boolean> {
  let success = false;
  const conn = await createConnection(config);

  try {
    const now = new Date();
    const createdAt = user.createdAt ?? now;
    const updatedAt = user.updatedAt ?? now;

    const sql = `
      INSERT INTO \`user\` (email, password, first_name, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`;

    await conn.execute(sql, [
      user.email.toLowerCase().trim(),
      user.password,
      user.firstName,
      user.active ?? true,
      createdAt,
      updatedAt,
    ]);

    success = true;
  } catch (e: any) {
    // 1062 = ER_DUP_ENTRY (email já existe)
    if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
      console.warn(`User already exists (email UNIQUE): ${user.email}`);
    } else {
      console.error(`Error inserting user:`, e);
    }
  } finally {
    await conn.end();
  }

  return success;
}