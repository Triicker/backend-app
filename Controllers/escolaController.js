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
            SELECT e.id, e.nome, e.id_cidade, e.ativo, c.nome AS nome_cidade, c.estado
            FROM escolas e
            JOIN cidades c ON e.id_cidade = c.id
            WHERE e.ativo = 1
            ORDER BY e.nome ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ALL INACTIVE
export const getInactiveEscolas = async (req, res, next) => {
    try {
        const query = `SELECT id, nome, data_atualizacao FROM escolas WHERE ativo = 0 ORDER BY data_atualizacao DESC`;
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
            SELECT e.id, e.nome, e.id_cidade, e.ativo, c.nome AS nome_cidade, c.estado
            FROM escolas e
            JOIN cidades c ON e.id_cidade = c.id
            WHERE e.id = $1 AND e.ativo = 1;
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
    const { nome, id_cidade, ativo } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido.' });
    }

    try {
        const { rows } = await db.query('SELECT * FROM escolas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Escola não encontrada para atualizar.' });
        }

        const fields = { nome, id_cidade, ativo };
        const queryParts = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                queryParts.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        queryParts.push(`data_atualizacao = NOW()`);
        values.push(id);

        const updateQuery = `UPDATE escolas SET ${queryParts.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
        const result = await db.query(updateQuery, values);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'A cidade especificada (id_cidade) não existe.' });
        }
        next(error);
    }
};

// SOFT DELETE
export const softDeleteEscola = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE escolas SET ativo = 0, data_atualizacao = NOW() WHERE id = $1 AND ativo = 1 RETURNING id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Escola não encontrada ou já está inativa.' });
        }
        res.status(200).json({ message: 'Escola desativada com sucesso.' });
    } catch (error) {
        next(error);
    }
};

// REACTIVATE
export const reactivateEscola = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE escolas SET ativo = 1, data_atualizacao = NOW() WHERE id = $1 AND ativo = 0 RETURNING *',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Escola não encontrada ou já está ativa.' });
        }
        res.status(200).json({ message: 'Escola reativada com sucesso!', escola: result.rows[0] });
    } catch (error) {
        next(error);
    }
};