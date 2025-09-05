import db from '../db/index.js';

// CREATE
export const createCidade = async (req, res, next) => {
    const { nome, estado } = req.body;
    if (!nome || !estado) {
        return res.status(400).json({ error: 'Nome e estado são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO cidades (nome, estado) VALUES ($1, $2) RETURNING *',
            [nome, estado]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Essa cidade já existe nesse estado.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllCidades = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM cidades ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getCidadeById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM cidades WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cidade não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateCidade = async (req, res, next) => {
    const { id } = req.params;
    const { nome, estado } = req.body;
    if (!nome || !estado) {
        return res.status(400).json({ error: 'Nome e estado são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE cidades SET nome = $1, estado = $2 WHERE id = $3 RETURNING *',
            [nome, estado, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cidade não encontrada para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Essa cidade já existe nesse estado.' });
        }
        next(error);
    }
};

// DELETE
export const deleteCidade = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM cidades WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Cidade não encontrada para deletar.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        // Foreign key violation
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar a cidade pois existem escolas associadas a ela.' });
        }
        next(error);
    }
};