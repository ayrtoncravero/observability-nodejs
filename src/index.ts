import { Request, Response } from 'express';
import express from 'express';
import logger from './utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('OK');
});

const port = process.env.PORT || 3000;

app.listen(port, () => logger.info(`⚡️ listening on port: ${port}`));
