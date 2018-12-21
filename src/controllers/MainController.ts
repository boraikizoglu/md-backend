import App from '../App';
import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator/check';
import { QueryResult } from 'pg';
import * as Correlation from 'node-correlation';
import * as stats from 'stats-lite';
import * as csv from 'csvtojson/v2';
import * as fs from 'fs';

interface IMainController {
    get(): void;
    postUpload(): void;
    getStock(): void;
    getStatistics(): void;
    getStocksList(): void;
}

// row field is null, it becomes string
interface IStock {
    Date: String;
    date?: String;
    Open: Number | String;
    High: Number | String;
    Low: Number | String;
    Close?: Number | String;
    close?: Number | String;
    'Adj Close': Number | String;
    Volume: Number | String;
    table_id: Number | String;
}

class MainController implements IMainController {

    public get(): void{
        App.router.get('/', (req, res) => {
            res.json({message: '/ get is called. Application is running successfully.'});
        });
    }

    private uploadQueryText(fileName: string, pathName: string, callback): void {
        let queryText: string = `INSERT INTO "test2" ("stocksymbol",DATE,OPEN,HIGH,LOW,CLOSE, ADJ_CLOSE, VOLUME, TABLE_ID) VALUES`;
        csv().fromFile(pathName).then((data: IStock[])=>{
            if(data.length === 0){
                return callback(true, null);
            }
            const stockSymbol: string = fileName;
            const now: number = new Date().getTime();
            data.forEach((row: IStock, index) => {
                // if row does not contain null elemenet, add to query string
                if(stockSymbol !== 'null' && row.Date !== 'null' &&
                    row.Open !== 'null' && row.High !== 'null' &&
                    row.Low !== 'null' && row.Close !== 'null' &&
                    row['Adj Close'] !== 'null' && row.Volume !== 'null'
                    ){
                        const rowString: string = index === data.length-1 ? // if it is the last row
                        ` ('${stockSymbol}', '${row.Date}', ${row.Open}, ${row.High}, ${row.Low},${row.Close}, ${row['Adj Close']}, ${row.Volume}, ${now})`
                        :
                        ` ('${stockSymbol}', '${row.Date}', ${row.Open}, ${row.High}, ${row.Low},${row.Close}, ${row['Adj Close']}, ${row.Volume}, ${now}), `;
                        queryText += rowString;
                     }
            });
            queryText += 'ON CONFLICT (stockSymbol, DATE, TABLE_ID) DO NOTHING;'; // update if there is a duplicate
            fs.unlinkSync(pathName); // delete the file
            callback(null, queryText);
        });
    }

    public postUpload(): void{
        // App.router.post('/upload2',
        // [
        //     check('stock_symbol').isLength({ min: 1 }),
        //     check('data').isLength({min: 1}),
        // ],
        // (req: Request, res: Response) => {
        //     // Finds the validation errors in this request and wraps them in an object with handy functions
        //     const errors = validationResult(req);
        //     if (!errors.isEmpty()) {
        //         return res.status(422).json({ errors: errors.array() });
        //     }

        //     // insert data to database
        //     App.db.query(this.uploadQueryText(req), (err, res2) => {
        //         if(err){
        //             console.log(err);
        //             res.json({status: 'ERROR', error: true});
        //         } else {
        //             res.json({status: 'SUCCESS', error: false});
        //         }
        //     });
        // });

        const upload = require('jquery-file-upload-middleware');
        upload.configure({
            uploadDir: __dirname + '/public/uploads/',
            uploadUrl: '/uploads',
        });

        /// Redirect all to home except post
        App.express.get('/upload', ( req, res ) => {
            res.redirect('/');
        });

        App.express.put('/upload', ( req, res ) => {
            res.redirect('/');
        });

        App.express.delete('/upload', ( req, res ) => {
            res.redirect('/');
        });

        App.express.use('/upload', (req, res, next) => {
            upload.fileHandler({
                uploadDir: () => {
                    return __dirname + '/public/uploads/';
                },
                uploadUrl: () => {
                    return '/uploads';
                },
            })(req, res, next);
        });

        upload.on('end', (fileInfo, req, res) => {
            // insert data to database
            const fileName: string = fileInfo.name;
            const pathName: string = __dirname + '/public/uploads/' + fileName;
            this.uploadQueryText(fileName, pathName, (err, queryString) =>{
                if(err){
                    // res.json({status: 'ERROR', error: true});
                } else if(queryString){
                    App.db.query(queryString, (err2, res2) => {
                        if(err2){
                            console.log(err2);
                            // res.json({status: 'ERROR', error: true});
                        } else {
                            // res.json({status: 'SUCCESS', error: false});
                        }
                    });
                }
            });
        });
    }

    private getStockByID(stockSymbol: string, tableID: number, callback: (err, res) => void){
        const queryText: string = `SELECT * FROM "test2" WHERE "stocksymbol" = '${stockSymbol}' AND "table_id" = ${tableID}`;
        App.db.query(queryText, (err2, res2: any) => {
            if(err2){
                callback(err2, null);
            } else {
                callback(null, res2);
            }
        });
    }

    public getStock(): void{
        App.router.get('/stock',
        [
            check('stock_symbol').isLength({ min: 1 }),
            check('table_id').isLength({ min: 7 }),
        ],
        (req, res) => {
            // Finds the validation errors in this request and wraps them in an object with handy functions
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }

            const {stock_symbol, table_id}: any = req.body;
            this.getStockByID(stock_symbol, table_id, (err2, res2: any) => {
                if(err2){
                    console.log(err2);
                    res.json({status: 'ERROR', error: true});
                } else {
                    res.json({status: 'SUCCESS', error: false, data: res2.rows});
                }
            });
        });
    }

    public getStocksList(): void{
        App.router.get('/stocksList', (req, res) => {
            const queryText: string = `SELECT DISTINCT stocksymbol,TABLE_ID FROM test2`;
            App.db.query(queryText, (err2, res2: any) => {
                if(err2){
                    console.log(err2);
                    res.json({status: 'ERROR', error: true});
                } else {
                    res.json({status: 'SUCCESS', error: false, stocks: res2.rows});
                }
            });
        });
    }

    // get correlation between two stock data sets
    private getCorrelation(res1: QueryResult, res2: QueryResult): number {
        const dataArray1 = [];
        const dataArray2 = [];
        res1.rows.forEach((row: IStock) => {
            let index = 0;
            let isFound: boolean = false;
            while(index < res2.rows.length && !isFound){
                if(row.date === res2.rows[index].date){
                    dataArray1.push(row.close);
                    dataArray2.push(res2.rows[index].close);
                    isFound = true;
                }
                index++;
            }
        });
        return Correlation.calc(dataArray1, dataArray2);
    }

    private getStdev(res1: QueryResult): number {
        const close: any[] = []; // close: nmber[]
        res1.rows.forEach((row: IStock) => {
            close.push(row.close);
        });
        return stats.stdev(close);
    }

    public getStatistics(): void{
        App.router.get('/statistics',
        [
            check('stock_symbol1').isLength({ min: 1 }),
            check('stock_symbol2').isLength({ min: 1 }),
            check('table_id1').isLength({ min: 1 }),
            check('table_id2').isLength({ min: 1 }),
        ],
        (req, res) => {
            // Finds the validation errors in this request and wraps them in an object with handy functions
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }

            const { stock_symbol1, stock_symbol2, table_id1, table_id2 } = req.body;
            this.getStockByID(stock_symbol1, table_id1, (err2, res2: any) => {
                if(err2){
                    console.log(err2);
                    res.json({status: 'ERROR', error: true});
                } else {
                    this.getStockByID(stock_symbol2, table_id2, (err3, res3: any) => {
                        if(err3){
                            console.log(err3);
                            res.json({status: 'ERROR', error: true});
                        } else {
                            res.json({
                                status: 'SUCCESS',
                                error: false,
                                stdev1: this.getStdev(res2),
                                stdev2: this.getStdev(res3),
                                corr: this.getCorrelation(res2, res3),
                            });
                        }
                    });
                }
            });
        });
    }

}

export default MainController;
