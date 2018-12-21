Before running the project, you need to install Typescript globally.

`sudo npm install -g typescript`

Then create a .env file in project directory similar to this one.

```
NODE_ENV=DEVELOPMENT

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=express
DB_PORT=8889

PORT=3002
```

### Development ( Runs TSLint and nodemon )

```bash
yarn run dev
```

### Running tests

```bash
yarn test
```

### Linting

```bash
yarn run lint
```