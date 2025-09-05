import db from '../db/index.js';

// CREATE
export const createJogo = async (req, res, next) => {
    const { nome, descricao, url_jogo, url_thumbnail } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO jogos (nome, descricao, url_jogo, url_thumbnail) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, descricao, url_jogo, url_thumbnail]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Já existe um jogo com este nome.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllJogos = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM jogos ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getJogoById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM jogos WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateJogo = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, url_jogo, url_thumbnail } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE jogos SET nome = $1, descricao = $2, url_jogo = $3, url_thumbnail = $4 WHERE id = $5 RETURNING *',
            [nome, descricao, url_jogo, url_thumbnail, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe um jogo com este nome.' });
        }
        next(error);
    }
};

// DELETE
export const deleteJogo = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM jogos WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado para deletar.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar o jogo pois existem pontuações associadas a ele.' });
        }
        next(error);
    }
};