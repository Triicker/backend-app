import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// READ - Obter todos os papéis
router.get('/', async (req, res) => {
    try {
        const allPapeis = await pool.query('SELECT * FROM papeis ORDER BY id');
        res.json(allPapeis.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

export default router;