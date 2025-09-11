import db from '../db/index.js';

// CREATE
export const createDisciplina = async (req, res, next) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const { rows } = await db.query('INSERT INTO disciplinas (nome) VALUES ($1) RETURNING *', [nome]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Já existe uma disciplina com este nome.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllDisciplinas = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM disciplinas ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getDisciplinaById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM disciplinas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Disciplina não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateDisciplina = async (req, res, next) => {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const { rows } = await db.query('UPDATE disciplinas SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Disciplina não encontrada para atualizar.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe uma disciplina com este nome.' });
        }
        next(error);
    }
};

// DELETE
export const deleteDisciplina = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM disciplinas WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Disciplina não encontrada para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        // Se houver jogos associados, o DB retornará um erro de chave estrangeira
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar a disciplina pois existem jogos associados a ela.' });
        }
        next(error);
    }
};

// READ JOGOS BY DISCIPLINA
export const getJogosByDisciplina = async (req, res, next) => {
    const { id } = req.params;
    const { anoId } = req.query; // Permite filtrar por ano também: /disciplinas/:id/jogos?anoId=...
    try {
        let query = `
            SELECT j.* FROM jogos j
            JOIN jogos_disciplinas jd ON j.id = jd.id_jogo
            WHERE jd.id_disciplina = $1
        `;
        const params = [id];

        if (anoId) {
            query += ` AND j.id IN (SELECT id_jogo FROM jogos_anos WHERE id_ano = $2)`;
            params.push(anoId);
        }

        query += ' ORDER BY j.nome ASC';

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};