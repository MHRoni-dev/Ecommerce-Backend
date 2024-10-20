import express, { Request, Response } from 'express';
import security from '@security/index';
import config from '@config/index';
import logger from '@logger/index';

const app = express();

//apply security
app.use(security);

//apply logger
app.use(logger);

//server health checking endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'server is working',
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.PORT, () => {
  console.log(
    `Server is running ✅ \nport: ${config.PORT} \nenvironment: ${config.NODE_ENV} `,
  );
});
