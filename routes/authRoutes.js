import { Router } from 'express';
import { loginUser } from '../controllers/authController.js';

const router = Router();

// Rota de Login -> POST /auth/login
router.post('/login', loginUser);

export default router;