import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// CREATE - Adicionar uma nova pontuação
router.post('/', async (req, res) => {
    const { id_usuario, id_jogo, pontuacao } = req.body;
    try {
        const newScore = await pool.query(
            'INSERT INTO pontuacoes (id_usuario, id_jogo, pontuacao) VALUES ($1, $2, $3) RETURNING *',
            [id_usuario, id_jogo, pontuacao]
        );
        res.status(201).json(newScore.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao adicionar pontuação', details: err.message });
    }
});

// READ - Obter todas as pontuações
router.get('/', async (req, res) => {
    try {
        const allScores = await pool.query('SELECT * FROM pontuacoes ORDER BY pontuacao DESC, data_registro DESC');
        res.json(allScores.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// READ - Obter pontuações de um usuário específico
router.get('/usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const userScores = await pool.query('SELECT * FROM pontuacoes WHERE id_usuario = $1 ORDER BY pontuacao DESC', [id_usuario]);
        res.json(userScores.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// UPDATE - Atualizar uma pontuação
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { pontuacao } = req.body;
    try {
        const updatedScore = await pool.query(
            'UPDATE pontuacoes SET pontuacao = $1, data_registro = NOW() WHERE id = $2 RETURNING *',
            [pontuacao, id]
        );
        if (updatedScore.rows.length === 0) {
            return res.status(404).json({ error: 'Pontuação não encontrada para atualizar' });
        }
        res.json({ message: 'Pontuação atualizada com sucesso!', score: updatedScore.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar pontuação', details: err.message });
    }
});

// DELETE - Deletar uma pontuação
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM pontuacoes WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ error: 'Pontuação não encontrada para deletar' });
        }
        res.json({ message: 'Pontuação deletada com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

export default router;
