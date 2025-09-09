import { Router } from 'express';
import { loginUser } from '../../Controllers/authController.js';

const router = Router();

// Rota de Login -> POST /auth/login
router.post('/login', loginUser);

export default router;