import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await registerUser(username, password);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    const status = message.includes('already taken') ? 409 : 400;
    res.status(status).json({ error: message });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});
