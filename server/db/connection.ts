import mysql from 'mysql2/promise';
import { DatabaseConfig } from './types';
let pool: mysql.Pool | undefined;

export function getConnectionPool(config: DatabaseConfig): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: Number(config.database.port ?? 3306),
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl ? 'Amazon RDS' : undefined,
      multipleStatements: true,

      // === Configurações de Pool ===
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000, // 10s
    });
  }
  return pool;
}