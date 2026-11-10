import express, { Request, Response } from 'express';
import { connectMongo } from '@ecotrack/db';
import { userService } from './services/user.service';
import { UserRole } from '@ecotrack/shared';
import { authRouter } from './routes/auth.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'identity-api', timestamp: new Date() });
});

// Routes d'authentification officielles (OpenAPI & Gateway)
app.use('/api/v1/auth', authRouter);
app.use('/auth', authRouter);

// Route d'inscription directe de secours (tests legacy)
app.post('/api/v1/auth/register-dev', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;
    const user = await userService.createUser({
      email,
      password,
      fullName,
      phoneNumber,
      role: role || UserRole.CITOYEN
    });
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export async function startServer() {
  await connectMongo();
  return app.listen(PORT, () => {
    console.log(`[IDENTITY-API] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Identity API:', err);
    process.exit(1);
  });
}

export { app };
