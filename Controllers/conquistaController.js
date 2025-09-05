import db from '../db/index.js';

// CREATE
export const createConquista = async (req, res, next) => {
    const { nome, descricao, icone_url } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO conquistas (nome, descricao, icone_url) VALUES ($1, $2, $3) RETURNING *',
            [nome, descricao, icone_url]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// READ ALL
export const getAllConquistas = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM conquistas ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getConquistaById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM conquistas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Conquista não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateConquista = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, icone_url } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE conquistas SET nome = $1, descricao = $2, icone_url = $3 WHERE id = $4 RETURNING *',
            [nome, descricao, icone_url, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Conquista não encontrada para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// DELETE
export const deleteConquista = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM conquistas WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Conquista não encontrada para deletar.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        // Foreign key violation
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar a conquista pois existem usuários que a possuem.' });
        }
        next(error);
    }
};