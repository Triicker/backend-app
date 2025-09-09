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

// READ BY SALA
export const getPontuacoesBySala = async (req, res, next) => {
    const { id_sala } = req.params;
    try {
        const query = `
            SELECT p.*, u.nome as nome_usuario, u.username
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario = u.id
            WHERE u.id_sala = $1
            ORDER BY p.pontuacao DESC, p.data_registro DESC;
        `;
        const { rows } = await db.query(query, [id_sala]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ RANKING BY JOGO
export const getRankingByJogo = async (req, res, next) => {
    const { id_jogo } = req.params;
    const limit = req.query.limit || 100; // Padrão de 100, mas pode ser ajustado via query string ex: ?limit=10

    try {
        const query = `
            SELECT
                RANK() OVER (ORDER BY MAX(p.pontuacao) DESC) as "rank",
                u.id as id_usuario,
                u.nome as nome_usuario,
                u.username,
                MAX(p.pontuacao) as pontuacao_maxima
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario = u.id
            WHERE p.id_jogo = $1
            GROUP BY u.id
            ORDER BY pontuacao_maxima DESC
            LIMIT $2;
        `;
        const { rows } = await db.query(query, [id_jogo, limit]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ RANKING BY ESCOLA
export const getRankingByEscola = async (req, res, next) => {
    const { id_escola, id_jogo } = req.params;
    const limit = req.query.limit || 100;

    try {
        const query = `
            SELECT
                RANK() OVER (ORDER BY MAX(p.pontuacao) DESC) as "rank",
                u.id as id_usuario,
                u.nome as nome_usuario,
                u.username,
                MAX(p.pontuacao) as pontuacao_maxima
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario = u.id
            WHERE u.id_escola = $1 AND p.id_jogo = $2
            GROUP BY u.id
            ORDER BY pontuacao_maxima DESC
            LIMIT $3;
        `;
        const { rows } = await db.query(query, [id_escola, id_jogo, limit]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ RANKING BY CIDADE
export const getRankingByCidade = async (req, res, next) => {
    const { id_cidade, id_jogo } = req.params;
    const limit = req.query.limit || 100;

    try {
        const query = `
            SELECT
                RANK() OVER (ORDER BY MAX(p.pontuacao) DESC) as "rank",
                u.id as id_usuario,
                u.nome as nome_usuario,
                u.username,
                e.nome as nome_escola,
                MAX(p.pontuacao) as pontuacao_maxima
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario = u.id
            JOIN escolas e ON u.id_escola = e.id
            WHERE e.id_cidade = $1 AND p.id_jogo = $2
            GROUP BY u.id, e.nome
            ORDER BY pontuacao_maxima DESC
            LIMIT $3;
        `;
        const { rows } = await db.query(query, [id_cidade, id_jogo, limit]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ RANKING BY ESTADO (REGIONAL)
export const getRankingByEstado = async (req, res, next) => {
    let { estado, id_jogo } = req.params;
    const limit = req.query.limit || 100;

    // Sanitiza os parâmetros para remover chaves, caso o usuário as envie por engano.
    if (estado && estado.startsWith('{') && estado.endsWith('}')) {
        estado = estado.substring(1, estado.length - 1);
    }
    if (id_jogo && id_jogo.startsWith('{') && id_jogo.endsWith('}')) {
        id_jogo = id_jogo.substring(1, id_jogo.length - 1);
    }

    try {
        const query = `
            SELECT
                RANK() OVER (ORDER BY MAX(p.pontuacao) DESC) as "rank",
                u.id as id_usuario,
                u.nome as nome_usuario,
                u.username,
                e.nome as nome_escola,
                c.nome as nome_cidade,
                MAX(p.pontuacao) as pontuacao_maxima
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario = u.id
            JOIN escolas e ON u.id_escola = e.id
            JOIN cidades c ON e.id_cidade = c.id
            WHERE c.estado = $1 AND p.id_jogo = $2
            GROUP BY u.id, e.nome, c.nome
            ORDER BY pontuacao_maxima DESC
            LIMIT $3;
        `;
        const { rows } = await db.query(query, [estado.toUpperCase(), id_jogo, limit]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ USUARIO RANK BY JOGO
export const getUsuarioRankByJogo = async (req, res, next) => {
    const { id_usuario, id_jogo } = req.params;

    try {
        const query = `
            WITH Ranking AS (
                SELECT
                    p.id_usuario,
                    MAX(p.pontuacao) as pontuacao_maxima,
                    RANK() OVER (ORDER BY MAX(p.pontuacao) DESC) as "rank"
                FROM pontuacoes p
                WHERE p.id_jogo = $1
                GROUP BY p.id_usuario
            )
            SELECT rank, pontuacao_maxima FROM Ranking WHERE id_usuario = $2;
        `;
        const { rows } = await db.query(query, [id_jogo, id_usuario]);
        res.status(200).json(rows[0] || { rank: null, pontuacao_maxima: null });
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