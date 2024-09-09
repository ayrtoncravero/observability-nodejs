import {NextFunction, Request, Response} from 'express';
import express from 'express';
import logger from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();
import client from 'prom-client';

const app = express();

const register = new client.Registry();
client.collectDefaultMetrics({register});

const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Número total de solicitudes HTTP recibidas',
    labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestCounter)

const responseTimeHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las solicitudes HTTP en segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5] // Rango de valores para medir
});

register.registerMetric(responseTimeHistogram)

type MeasurableRequest = Request & { startTime: number };

// @ts-ignore
app.use((req: MeasurableRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        console.log('ends')
        httpRequestCounter.labels({
            route: req.route?.path || req.path,
            method: req.method,
            status_code: res.statusCode
        }).inc();

        const responseTime = Date.now() - req.startTime;
        responseTimeHistogram.labels({
            route: req.route?.path || req.path,
            method: req.method,
            status_code: res.statusCode
        }).observe(responseTime / 1000); // Segundos
    });
    req.startTime = Date.now();
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('OK');
});

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => logger.info(`⚡️ listening on port: ${port}`));
