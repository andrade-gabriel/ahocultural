export interface DatabaseConfig {
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
        ssl: boolean;
    }
}