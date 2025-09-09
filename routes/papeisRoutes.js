import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// READ - Obter todos os papéis
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM papeis ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
});

export default router;