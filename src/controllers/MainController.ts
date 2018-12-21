import App from '../App';
import { Request, Response } from 'express';
import { Query } from 'pg';

interface IMainController {
    get(): void;
    postUpload(): void;
    getStock(): void;
    getStatistics(): void;
}

interface IStock {
    Date: String;
    Open: Number;
    High: Number;
    Low: Number;
    Close: Number;
    'Adj Close': Number;
    Volume: Number;
}
class MainController implements IMainController {

    public get(): void{
        App.router.get('/', (req, res) => {
            res.json({message: '/ get is called. Application is running successfully.'});
        });
    }

    private uploadQueryText(req: Request): string{
        let queryText: string = `INSERT INTO "test2" ("stocksymbol",DATE,OPEN,HIGH,LOW,CLOSE, ADJ_CLOSE, VOLUME, TABLE_ID) VALUES`;
        const data: IStock[] = JSON.parse(req.body.data);
        const stockSymbol: string = req.body.stock_symbol;
        const now: number = new Date().getTime();
        data.forEach((row: IStock, index) => {
            const rowString: string = index === data.length-1 ? // if it is the last row
            ` ('${stockSymbol}', '${row.Date}', ${row.Open}, ${row.High}, ${row.Low},${row.Close}, ${row['Adj Close']}, ${row.Volume}, ${now})`
            :
            ` ('${stockSymbol}', '${row.Date}', ${row.Open}, ${row.High}, ${row.Low},${row.Close}, ${row['Adj Close']}, ${row.Volume}, ${now}), `;

            queryText += rowString;
        });
        console.log('123error', queryText);
        return queryText += 'ON CONFLICT (stockSymbol, DATE, TABLE_ID) DO NOTHING;'; // update if there is a duplicate
    }

    public postUpload(): void{
        App.router.post('/upload', (req: Request, res: Response) => {
            // insert data to database
            App.db.query(this.uploadQueryText(req), (err, res2) => {
                if(err){
                    console.log(err);
                    res.json({status: 'ERROR', error: true});
                } else {
                    res.json({status: 'SUCCESS', error: false});
                }
            });
        });
    }

    public getStock(): void{
        App.router.get('/stock', (req, res) => {
            const {stock_symbol, table_id}: any = req.body;
            const queryText: string = `SELECT * FROM "test2" WHERE "stocksymbol" = '${stock_symbol}' AND "table_id" = ${table_id}`;
            App.db.query(queryText, (err, res2: any) => {
                if(err){
                    console.log(err);
                    res.json({status: 'ERROR', error: true});
                } else {
                    res.json({status: 'SUCCESS', error: false, data: res2.rows});
                }
            });
        });
    }

    public getStatistics(): void{
        App.router.get('/statistics', (req, res) => {
            res.json({message: 'success'});
        });
    }

}

export default MainController;
