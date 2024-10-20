import morgan from 'morgan';
import config from '@config/index';

const { LOG } = config;

const logger = morgan(LOG.LOG_LEVEL);
export default logger;
