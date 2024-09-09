import {NextFunction, Request, Response} from 'express';
import express from 'express';
import logger from './utils/logger';
import dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();
import client from 'prom-client';
import {faker} from "@faker-js/faker";

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

const stockValidation = new client.Counter({
    name: 'stock_validation',
    help: 'Stock validation on Warehouse system',
    labelNames: [],
})

const paymentValidationSuccess = new client.Counter({
    name: 'payment_validation_success',
    help: 'Payment execution success',
    labelNames: [],
});

const paymentValidationFailed = new client.Counter({
    name: 'payment_validation_failed',
    help: 'Payment execution failed',
    labelNames: [],
})

const checkoutProcessStarted = new client.Counter({
    name: 'checkout_process_started',
    help: 'Checkout process started',
    labelNames: [],
})

register.registerMetric(checkoutProcessStarted)
register.registerMetric(stockValidation)
register.registerMetric(paymentValidationSuccess)
register.registerMetric(paymentValidationFailed)

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

const wrapResolve = (probability: number) => {
    return new Promise((resolve, reject) => {
        const result = faker.helpers.maybe(
            () => {
                return 'ok'
            },
            {probability}
        )
        if (result) {
            resolve({})
        } else {
            reject()
        }
    })
}

const validateStock = async (body: any) => {
    const promise = wrapResolve(0.95);

    await promise
    stockValidation.inc()
}

const validatePayment = async (body: any) => {
    const promise = wrapResolve(0.8)

    try {
        await promise;
        paymentValidationSuccess.inc()
    } catch (e) {
        paymentValidationFailed.inc()
        throw e;
    }
}

app.post('/payments', async (req: Request, res: Response) => {

    try {
        const body = req.body;

        checkoutProcessStarted.inc()

        await validateStock(body);

        await validatePayment(body)

        res.send('OK');
    } catch (e) {
        res.status(400).json({message: 'failed process'})
    }

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
