import db from '../db/index.js';

// CREATE: Professor atribui um jogo a uma sala
export const createAtividade = async (req, res, next) => {
    const { id_jogo, id_sala, data_fim } = req.body;
    const id_professor = req.user.id; // Obtido do token JWT após o login

    if (!id_jogo || !id_sala) {
        return res.status(400).json({ error: 'Os campos "id_jogo" e "id_sala" são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO atividades (id_jogo, id_sala, id_professor, data_fim) VALUES ($1, $2, $3, $4) RETURNING *',
            [id_jogo, id_sala, id_professor, data_fim] // data_fim pode ser null
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { // foreign_key_violation
            return res.status(404).json({ error: 'Jogo, Sala ou Professor não encontrado.' });
        }
        next(error);
    }
};

// READ: Listar atividades da sala do ALUNO LOGADO
export const getAtividadesMinhaSala = async (req, res, next) => {
    const { id_sala } = req.user; // Obtido do token JWT

    if (!id_sala) {
        // Se o usuário não tem uma sala (ex: professor, admin), retorna uma lista vazia.
        return res.status(200).json([]);
    }

    try {
        const query = `
            SELECT 
                a.id, a.data_inicio, a.data_fim, a.status,
                j.id as id_jogo, j.nome as nome_jogo, j.descricao as descricao_jogo, j.url_thumbnail, j.url_jogo,
                p.nome as nome_professor
            FROM atividades a
            JOIN jogos j ON a.id_jogo = j.id
            LEFT JOIN usuarios p ON a.id_professor = p.id
            WHERE a.id_sala = $1 AND a.status = 'ativa'
            ORDER BY a.data_inicio DESC;
        `;
        const { rows } = await db.query(query, [id_sala]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ: Listar atividades de uma sala específica (para alunos verem)
export const getAtividadesBySala = async (req, res, next) => {
    const { id_sala } = req.params;
    try {
        const query = `
            SELECT 
                a.id, a.data_inicio, a.data_fim, a.status,
                j.id as id_jogo, j.nome as nome_jogo, j.descricao as descricao_jogo, j.url_thumbnail,
                p.nome as nome_professor
            FROM atividades a
            JOIN jogos j ON a.id_jogo = j.id
            LEFT JOIN usuarios p ON a.id_professor = p.id
            WHERE a.id_sala = $1 AND a.status = 'ativa'
            ORDER BY a.data_inicio DESC;
        `;
        const { rows } = await db.query(query, [id_sala]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ: Listar atividades criadas pelo professor logado
export const getAtividadesByProfessor = async (req, res, next) => {
    const id_professor = req.user.id; // Pega o ID do professor logado
    try {
        const query = `
            SELECT 
                a.id, a.status, a.data_criacao,
                j.nome as nome_jogo,
                s.nome as nome_sala
            FROM atividades a
            JOIN jogos j ON a.id_jogo = j.id
            JOIN salas s ON a.id_sala = s.id
            WHERE a.id_professor = $1
            ORDER BY a.data_criacao DESC;
        `;
        const { rows } = await db.query(query, [id_professor]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// DELETE: Professor remove uma atividade que ele criou
export const deleteAtividade = async (req, res, next) => {
    const { id } = req.params; // ID da atividade
    const id_professor = req.user.id; // ID do professor logado

    try {
        // Deleta a atividade APENAS se o ID do professor bater com o que está no registro
        const { rowCount } = await db.query('DELETE FROM atividades WHERE id = $1 AND id_professor = $2', [id, id_professor]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Atividade não encontrada ou você não tem permissão para deletá-la.' });
        }
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};