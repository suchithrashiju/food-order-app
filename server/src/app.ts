import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import router from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
