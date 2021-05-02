import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import { quoteRoute } from './routes/quoteRoute';
import { isProd } from './helpers/helpers';
import assert from 'assert';
import logger from './helpers/logger';

['EXCHANGERATE_API_URL', 'EXCHANGERATE_API_KEY', 'NODE_PORT'].forEach(key => {
    assert(process.env[key], `${key} not defined in .env file!`);
});

const port = process.env.NODE_PORT;
const app = express();

app.use(morgan(isProd() ? 'combined' : 'dev'));
app.use(helmet());

app.get('/quote', quoteRoute);

app.listen(port, () => {
    logger.info('API listening on port http://localhost:%d', port);
});
