import { Pool } from 'pg';

const pl: Pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: true,
});

pl.query('SELECT NOW()', (err, res) => {
  if(err){
      console.log('An error occurred', err);
  } else {
      console.log('Successfully connected to database');
      // console.log(res);
  }
});

const createData: string = `CREATE TABLE IF NOT EXISTS test2(
    stocksymbol VARCHAR(50) NOT NULL,
    DATE VARCHAR(50) NOT NULL,
    OPEN REAL NOT NULL,
    HIGH REAL NOT NULL,
    LOW REAL NOT NULL,
    CLOSE REAL NOT NULL,
    ADJ_CLOSE REAL NOT NULL,
    VOLUME REAL NOT NULL,
    TABLE_ID BIGSERIAL NOT NULL,
    PRIMARY KEY (TABLE_ID, DATE, stocksymbol)
    );`;
pl.query(createData, (err, res) => {
    if(err){
        console.log(err);
    } else if(res){
        console.log('CREATED TABLE');
    }
});

const createIndex: string =
    `CREATE INDEX IF NOT EXISTS test2
    ON test2 (stocksymbol, TABLE_ID)`;
pl.query(createIndex, (err, res) => {
    if(err){
        console.log(err);
    } else if(res){
        console.log('TABLE IS INDEXED');
    }
});

module.exports = pl;
