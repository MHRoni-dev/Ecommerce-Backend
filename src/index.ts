import connectDatabase from '@app/database';
import config from '@config/index';
import app from './app';

async function startApp() {
  await connectDatabase(config.DATABASE);
  console.log('............\nStarting server..');
  app.listen(config.PORT, () => {
    console.log(
      `Server is running ✅ \nport: ${config.PORT} \nenvironment: ${config.NODE_ENV} `,
    );
  });
}

startApp();
