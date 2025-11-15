import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import userRoutes from './routes/userRoutes.js';
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', environment: env.NODE_ENV });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});
app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
});
