import config from '@config/index';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  limit: config.SECURITY.REQ_LIMIT, //  req in a pulse
  windowMs: config.SECURITY.TIME_FRAME, // pulse time in ms
  message: {
    status: 'fail',
    message: 'Too many request, try again later',
  },
});

const security = [helmet(), hpp(), cors(), limiter];

export default security;
