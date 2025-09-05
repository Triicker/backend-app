import db from '../db/index.js';

// CREATE
export const createPontuacao = async (req, res, next) => {
    const { id_usuario, id_jogo, pontuacao } = req.body;

    if (!id_usuario || !id_jogo || pontuacao === undefined) {
        return res.status(400).json({ error: 'Os campos id_usuario, id_jogo e pontuacao são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO pontuacoes (id_usuario, id_jogo, pontuacao) VALUES ($1, $2, $3) RETURNING *',
            [id_usuario, id_jogo, pontuacao]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { // foreign_key_violation
            // Este erro agora pode ser por um usuário ou um jogo inexistente.
            return res.status(404).json({ error: 'Usuário ou Jogo não encontrado.' });
        }
        next(error);
    }
};

// READ ALL
export const getAllPontuacoes = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM pontuacoes ORDER BY pontuacao DESC, data_registro DESC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ BY USER
export const getPontuacoesByUsuario = async (req, res, next) => {
    const { id_usuario } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM pontuacoes WHERE id_usuario = $1 ORDER BY pontuacao DESC', [id_usuario]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updatePontuacao = async (req, res, next) => {
    const { id } = req.params;
    const { pontuacao } = req.body;

    if (pontuacao === undefined || typeof pontuacao !== 'number') {
        return res.status(400).json({ error: "O campo 'pontuacao' é obrigatório e deve ser um número." });
    }

    try {
        const { rows } = await db.query(
            'UPDATE pontuacoes SET pontuacao = $1, data_registro = NOW() WHERE id = $2 RETURNING *',
            [pontuacao, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pontuação não encontrada para atualizar.' });
        }
        res.status(200).json({ message: 'Pontuação atualizada com sucesso!', score: rows[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE
export const deletePontuacao = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM pontuacoes WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Pontuação não encontrada para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};