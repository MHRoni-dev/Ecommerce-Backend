import express, { Request, Response } from 'express';
import security from '@security/index';
import logger from '@logger/index';
import documentation from '@docs/index';
import { handleError } from '@error/index';
import productRoutesV1 from '@app/v1/product/routes';

const app = express();

//apply security
app.use(security);

//apply logger
app.use(logger);

app.use(express.json());

//if anyone check at root level
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the ECOMMERCE API',
    timeStamp: new Date().toISOString(),
  });
});

//server health checking endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'server is working',
    timestamp: new Date().toISOString(),
  });
});

//serve api documentation
app.use('/docs', ...documentation);

// routes
app.use('/api/v1/product', productRoutesV1);

// global error Handler
app.use(handleError);

export default app;
