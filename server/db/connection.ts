import mysql from 'mysql2/promise';
import { DatabaseConfig } from './types';

export async function createConnection(config: DatabaseConfig) {
    return await mysql.createConnection({
        host: config.database.host,
        port: Number(config.database.port ?? 3306),
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        ssl: config.database.ssl ? 'Amazon RDS' : undefined,
        multipleStatements: true
    });
}
