import db from '../db/index.js';

// CREATE
export const createEscola = async (req, res, next) => {
    const { nome, id_cidade } = req.body;
    if (!nome || !id_cidade) {
        return res.status(400).json({ error: 'Nome e id_cidade são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO escolas (nome, id_cidade) VALUES ($1, $2) RETURNING *',
            [nome, id_cidade]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { // foreign_key_violation
            return res.status(404).json({ error: 'A cidade especificada (id_cidade) não existe.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllEscolas = async (req, res, next) => {
    try {
        const query = `
            SELECT e.id, e.nome, e.id_cidade, c.nome AS nome_cidade, c.estado
            FROM escolas e
            JOIN cidades c ON e.id_cidade = c.id
            ORDER BY e.nome ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getEscolaById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT e.id, e.nome, e.id_cidade, c.nome AS nome_cidade, c.estado
            FROM escolas e
            JOIN cidades c ON e.id_cidade = c.id
            WHERE e.id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Escola não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateEscola = async (req, res, next) => {
    const { id } = req.params;
    const { nome, id_cidade } = req.body;
    if (!nome || !id_cidade) {
        return res.status(400).json({ error: 'Nome e id_cidade são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE escolas SET nome = $1, id_cidade = $2 WHERE id = $3 RETURNING *',
            [nome, id_cidade, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Escola não encontrada para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'A cidade especificada (id_cidade) não existe.' });
        }
        next(error);
    }
};

// DELETE
export const deleteEscola = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM escolas WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Escola não encontrada para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar a escola pois existem salas ou usuários associados a ela.' });
        }
        next(error);
    }
};