import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as mysql2 from 'mysql2';
import { MainController } from './controllers';

interface IApp {
  getExpress(): express.Application;
}

class App implements IApp {
  public static express: express.Express;
  public static db: mysql2.Connection;
  public static router: express.Router;

  public getExpress(): express.Express{
    return App.express;
  }

  public constructor() {
    // sets environment variables
    const envVariables = dotenv.config();
    if (envVariables.error) {
      throw envVariables.error;
    }

    // console.log('\n-----ENVIRONMENT VARIABLES-----\n', envVariables.parsed);
    console.log('-----------------------\n');

    App.express = express();
    App.db = require('./db/DB');
    App.router = express.Router();

    const corsOption = {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      exposedHeaders: ['x-auth-token'],
    };

    // parse
    App.express.use(cors(corsOption));

    // parse application/x-www-form-urlencoded
    App.express.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    App.express.use(bodyParser.json());

    // get user ip with request
    App.express.set('trust proxy', true);

    // mounts routes
    this.mountRoutes();
  }

  private mountRoutes(): void {
    // user controllers
    const mainController = new MainController();
    mainController.get();
    mainController.getSecret();

    App.express.use('/', App.router);
  }

}

export default App;
