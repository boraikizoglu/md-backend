import { Pool } from 'pg';

const pl: any = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: true,
});

pl.query('SELECT NOW()', (err, res) => {
  console.log(err, res);
  pl.end();
});

module.exports = pl;
