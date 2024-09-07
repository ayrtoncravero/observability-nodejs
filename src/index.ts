import { Request, Response } from 'express';
import express from 'express';
const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('OK');
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log('listening on port: ', port));
