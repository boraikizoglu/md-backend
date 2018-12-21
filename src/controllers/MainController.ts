import * as express from 'express';
import * as mysql2 from 'mysql2';
import App from '../App';

interface IMainController {
    get(): void;
    getSecret(): void;
}

class MainController implements IMainController {

    // ---------------------------------------------
    public get(): void{
        App.router.get('/', (req, res) => {
            res.json({message: '/ get is called. Application is running successfully.'});
        });
    }

    public getSecret(): void{
        App.router.get('/secret', (req, res, next) => {
            res.json({message: 'Success! You can not see this without a token'});
        });
    }
}

export default MainController;
