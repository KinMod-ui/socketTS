import { createClient } from '@libsql/client';
import 'dotenv/config';

const getDB = async () => {
  const config = {
    url: process.env.DB_URL as string,
    authToken: process.env.DB_AUTH_TOKEN as string,
  };
  // console.log('DB URL', process.env);
  const db = createClient(config);

  return db;
};

export default getDB;
