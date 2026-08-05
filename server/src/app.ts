import cors from 'cors';
import express from 'express';

import { env } from '@src/config/env';
import { errorMiddleware } from '@src/middlewares/error.middleware';
import { notFoundMiddleware } from '@src/middlewares/notFound.middleware';
import router from '@src/routes/index';

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
