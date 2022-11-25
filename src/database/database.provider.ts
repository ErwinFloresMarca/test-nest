import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
process.env.NODE_ENV === 'production' ? null : dotenv.config();

/**
 * provider para la establecer la coneccion con la base de datos
 */
export const databaseProvider = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const AppDataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'my-secret-pws',
        database: process.env.DB_NAME || 'db_name',
        synchronize: process.env.DB_SYNC_TYPEORM === 'true' ? true : false,
        logging: process.env.DB_SHOW_LOG_TYPEORM === 'true' ? true : false,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      });

      return AppDataSource.initialize();
    },
  },
];

/**
 * a provider para el uso de la conecccion establecida anteriormente
 */
export const connectionProviders = {
  provide: 'CONNECTION_PROVIDER',
  useFactory: (dataSource: DataSource) => dataSource.manager,
  inject: ['DATA_SOURCE'],
};
