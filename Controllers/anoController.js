import db from '../db/index.js';

// CREATE
export const createAno = async (req, res, next) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const { rows } = await db.query('INSERT INTO anos (nome) VALUES ($1) RETURNING *', [nome]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Já existe um ano com este nome.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllAnos = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM anos ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getAnoById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM anos WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ano não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateAno = async (req, res, next) => {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const { rows } = await db.query('UPDATE anos SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ano não encontrado para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe um ano com este nome.' });
        }
        next(error);
    }
};

// DELETE
export const deleteAno = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM anos WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Ano não encontrado para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar o ano pois existem jogos associados a ele.' });
        }
        next(error);
    }
};

// READ JOGOS BY ANO
export const getJogosByAno = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT j.* FROM jogos j
            JOIN jogos_anos ja ON j.id = ja.id_jogo
            WHERE ja.id_ano = $1
            ORDER BY j.nome ASC
        `;
        const { rows } = await db.query(query, [id]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};