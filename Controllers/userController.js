import db from '../db/index.js';
import bcrypt from 'bcrypt';

// Colunas a serem retornadas para evitar expor a senha
const publicUserColumns = 'id, nome, username, id_papel, id_escola, id_sala, matricula, ano, data_criacao, data_atualizacao, atividade';

export const createUser = async (req, res, next) => {
    const { nome, username, senha, id_papel, id_escola, id_sala, matricula, ano } = req.body;

    if (!nome || !username || !senha || !id_papel) {
        return res.status(400).json({ error: 'Campos nome, username, senha e id_papel são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUserQuery = `
            INSERT INTO usuarios (nome, username, senha, id_papel, id_escola, id_sala, matricula, ano)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING ${publicUserColumns};
        `;
        const values = [nome, username, hashedPassword, id_papel, id_escola, id_sala, matricula, ano];
        const result = await db.query(newUserQuery, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'O nome de usuário já existe.' });
        }
        next(error); // Passa o erro para o middleware de tratamento de erros
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const result = await db.query(`SELECT ${publicUserColumns} FROM usuarios WHERE atividade = 1 ORDER BY nome ASC`);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const getInactiveUsers = async (req, res, next) => {
    try {
        // Busca usuários com atividade = 0 e ordena pelos mais recentemente desativados
        const result = await db.query(`SELECT ${publicUserColumns} FROM usuarios WHERE atividade = 0 ORDER BY data_atualizacao DESC`);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT ${publicUserColumns} FROM usuarios WHERE id = $1 AND atividade = 1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const getUsersByRole = (roleId) => async (req, res, next) => {
    try {
        const result = await db.query(`SELECT ${publicUserColumns} FROM usuarios WHERE id_papel = $1 AND atividade = 1 ORDER BY nome ASC`, [roleId]);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { nome, username, senha, id_papel, id_escola, id_sala, matricula, ano, atividade } = req.body;

    try {
        // Busca o usuário para garantir que ele existe antes de tentar atualizar
        const userExists = await db.query('SELECT id FROM usuarios WHERE id = $1', [id]);
        if (userExists.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
        }

        let hashedPassword;
        if (senha) {
            hashedPassword = await bcrypt.hash(senha, 10);
        }

        const fields = { nome, username, senha: hashedPassword, id_papel, id_escola, id_sala, matricula, ano, atividade };
        const queryParts = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                queryParts.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        if (queryParts.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido.' });
        }

        queryParts.push(`data_atualizacao = NOW()`);
        values.push(id);

        const updateQuery = `UPDATE usuarios SET ${queryParts.join(', ')} WHERE id = $${paramIndex} RETURNING ${publicUserColumns};`;
        const result = await db.query(updateQuery, values);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'O nome de usuário já existe.' });
        }
        next(error);
    }
};

export const softDeleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE usuarios SET atividade = 0, data_atualizacao = NOW() WHERE id = $1 AND atividade = 1 RETURNING id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou já está inativo.' });
        }
        res.status(200).json({ message: 'Usuário desativado com sucesso.' });
    } catch (error) {
        next(error);
    }
};

export const reactivateUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE usuarios SET atividade = 1, data_atualizacao = NOW() WHERE id = $1 AND atividade = 0 RETURNING ${publicUserColumns}`,
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou já está ativo.' });
        }
        res.status(200).json({ message: 'Usuário reativado com sucesso!', user: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
