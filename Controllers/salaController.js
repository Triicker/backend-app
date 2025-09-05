import db from '../db/index.js';

// CREATE
export const createSala = async (req, res, next) => {
    const { nome, id_escola } = req.body;
    if (!nome || !id_escola) {
        return res.status(400).json({ error: 'Nome e id_escola são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO salas (nome, id_escola) VALUES ($1, $2) RETURNING *',
            [nome, id_escola]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { // foreign_key_violation
            return res.status(404).json({ error: 'A escola especificada (id_escola) não existe.' });
        }
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Essa sala já existe nessa escola.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllSalas = async (req, res, next) => {
    try {
        const query = `
            SELECT s.id, s.nome, s.id_escola, e.nome AS nome_escola
            FROM salas s
            JOIN escolas e ON s.id_escola = e.id
            ORDER BY e.nome, s.nome ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ BY ESCOLA
export const getSalasByEscola = async (req, res, next) => {
    const { id_escola } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM salas WHERE id_escola = $1 ORDER BY nome ASC', [id_escola]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getSalaById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM salas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sala não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateSala = async (req, res, next) => {
    const { id } = req.params;
    const { nome, id_escola } = req.body;
    if (!nome || !id_escola) {
        return res.status(400).json({ error: 'Nome e id_escola são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE salas SET nome = $1, id_escola = $2 WHERE id = $3 RETURNING *',
            [nome, id_escola, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sala não encontrada para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'A escola especificada (id_escola) não existe.' });
        }
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Essa sala já existe nessa escola.' });
        }
        next(error);
    }
};

// DELETE
export const deleteSala = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM salas WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Sala não encontrada para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar a sala pois existem usuários associados a ela.' });
        }
        next(error);
    }
};