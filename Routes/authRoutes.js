import express from 'express';
import { loginUser } from '../controllers/authController.js';

const router = express.Router();

// Rota de Login
router.post('/login', loginUser);

export default router;