import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { loadConfig } from './config';
import { connectDatabase } from './config/database';
import { globalErrorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth.middleware';

// Repositories
import { MockProblemRepository } from './repositories/MockProblemRepository';
import { MockSubmissionRepository } from './repositories/MockSubmissionRepository';
import { MongoProblemRepository } from './repositories/MongoProblemRepository';
import { MongoSubmissionRepository } from './repositories/MongoSubmissionRepository';

// Services
import { JudgeService } from './services/judge.service';
import { ProblemService } from './services/problem.service';
import { SubmissionService } from './services/submission.service';
import { AuthService } from './services/auth.service';

// External API
import { LeetCodeApiClient } from './api/external/LeetCodeApiClient';

// Controllers
import { ProblemController } from './controllers/problem.controller';
import { SubmissionController } from './controllers/submit.controller';

// Routes
import { createProblemRoutes } from './routes/problem.routes';
import { createSubmissionRoutes } from './routes/submit.routes';
import { createAuthRoutes } from './routes/auth.routes';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = express();

  // ─── Middleware ──────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // ─── Database (conditional) ─────────────────────────────────────
  if (config.useDb && config.mongodbUri) {
    await connectDatabase(config.mongodbUri);
  }

  // ─── Dependency Injection ───────────────────────────────────────
  const problemRepo =
    config.useDb && config.mongodbUri
      ? new MongoProblemRepository()
      : new MockProblemRepository();

  const submissionRepo =
    config.useDb && config.mongodbUri
      ? new MongoSubmissionRepository()
      : new MockSubmissionRepository();

  const externalApi = new LeetCodeApiClient();
  const judgeService = new JudgeService();
  const problemService = new ProblemService(problemRepo, externalApi);
  const submissionService = new SubmissionService(
    judgeService,
    submissionRepo,
    problemRepo
  );
  const authService = new AuthService(config.jwtSecret);

  const problemController = new ProblemController(problemService);
  const submissionController = new SubmissionController(submissionService);

  // ─── Routes ─────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      dbConnected: config.useDb,
    });
  });

  app.use('/api/problems', createProblemRoutes(problemController));
  app.use(
    '/api/submissions',
    createSubmissionRoutes(submissionController, authenticateToken(config.jwtSecret))
  );
  app.use('/api/auth', createAuthRoutes(authService));

  // ─── Global Error Handler ──────────────────────────────────────
  app.use(globalErrorHandler);

  // ─── Start Server ──────────────────────────────────────────────
  app.listen(config.port, () => {
    console.log(
      `Nexorithm Backend running on http://localhost:${config.port}`
    );
    console.log(`   Mode: ${config.nodeEnv}`);
    console.log(`   Database: ${config.useDb ? 'MongoDB' : 'In-Memory'}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});