import { Router } from 'express';
import db from './db/index.js'; // Caminho corrigido e nome da variável corrigido
import { verifyJWT } from './authMiddleware.js';

const router = Router();

// Aplica o middleware de autenticação para todas as rotas de usuários
router.use(verifyJWT);

// CREATE - Criar um novo usuário
router.post('/', async (req, res) => {
    const { nome, username, senha, id_papel, escola, matricula, ano, estado, cidade, ativo = 1 } = req.body;
    try {
        // AVISO: A senha está sendo salva como texto plano.
        const newUser = await db.query(
            'INSERT INTO usuarios (nome, username, senha, id_papel, escola, matricula, ano, estado, cidade, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, nome, username, ativo, data_criacao',
            [nome, username, senha, id_papel, escola, matricula, ano, estado, cidade, ativo]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao criar usuário', details: err.message });
    }
});

// READ - Obter todos os usuários (com filtro opcional por 'ativo')
router.get('/', async (req, res) => {
    const { ativo } = req.query;
    let queryText = 'SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao, ativo FROM usuarios';
    const queryParams = [];

    if (ativo !== undefined) {
        if (ativo !== '1' && ativo !== '0') {
            return res.status(400).json({ error: "O parâmetro 'ativo' deve ser '1' (ativo) ou '0' (inativo)." });
        }
        queryText += ' WHERE ativo = $1';
        queryParams.push(Number(ativo));
    }

    queryText += ' ORDER BY nome ASC';

    try {
        const { rows } = await db.query(queryText, queryParams); // Corrigido para db.query
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// READ - Rotas específicas por papel
const papelRoutes = [
    { papel: 1, path: '/alunos', fields: 'id, nome, username, escola, matricula, ano, ativo' },
    { papel: 2, path: '/professores', fields: 'id, nome, username, escola, ativo' },
    { papel: 3, path: '/gestores', fields: 'id, nome, username, ativo' },
    { papel: 4, path: '/admins', fields: 'id, nome, username, ativo' }
];

papelRoutes.forEach(({ papel, path, fields }) => {
    router.get(path, async (req, res) => {
        try {
            const result = await db.query( // Corrigido para db.query
                `SELECT ${fields} FROM usuarios WHERE id_papel = $1 AND ativo = 1 ORDER BY nome ASC`,
                [papel]
            );
            res.status(200).json(result.rows);
        } catch (error) {
            console.error(`Erro ao buscar ${path}:`, error);
            res.status(500).json({ error: `Erro interno do servidor ao buscar ${path}.` });
        }
    });
});

// READ - Obter um usuário pelo ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.query('SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao, ativo FROM usuarios WHERE id = $1', [id]); // Corrigido para db.query
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// UPDATE - Atualizar um usuário (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, username, escola, matricula, ano, estado, cidade, id_papel, ativo } = req.body;
    try {
        const updatedUser = await db.query( // Corrigido para db.query
            'UPDATE usuarios SET nome = $1, username = $2, escola = $3, matricula = $4, ano = $5, estado = $6, cidade = $7, id_papel = $8, ativo = $9, data_atualizacao = NOW() WHERE id = $10 RETURNING id, nome, username, ativo',
            [nome, username, escola, matricula, ano, estado, cidade, id_papel, ativo, id]
        );
        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para atualizar' });
        }
        res.json({ message: 'Usuário atualizado com sucesso!', user: updatedUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: err.message });
    }
});

// PATCH - Atualizar parcialmente um usuário
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const fieldsToUpdate = req.body;
    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Corpo da requisição vazio.' });
    }

    const allowedFields = ['nome', 'username', 'escola', 'matricula', 'ano', 'estado', 'cidade', 'id_papel', 'ativo'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field in fieldsToUpdate) {
        if (allowedFields.includes(field)) {
            if (field === 'ativo' && ![0, 1].includes(fieldsToUpdate[field])) {
                 return res.status(400).json({ error: "O campo 'ativo' deve ser 0 ou 1." });
            }
            setClauses.push(`${field} = $${paramIndex++}`);
            values.push(fieldsToUpdate[field]);
        }
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido fornecido.' });
    }

    values.push(id);
    const queryText = `UPDATE usuarios SET ${setClauses.join(', ')}, data_atualizacao = NOW() WHERE id = $${paramIndex} RETURNING id, nome, username, ativo, data_atualizacao`;

    try {
        const result = await db.query(queryText, values); // Corrigido para db.query
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.json({ message: 'Usuário atualizado com sucesso!', user: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err.message);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// DELETE - Desativar um usuário (Soft Delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query( // Corrigido para db.query
            'UPDATE usuarios SET ativo = 0, data_atualizacao = NOW() WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Usuário desativado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PATCH - Reativar um usuário
router.patch('/:id/reactivate', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE usuarios SET ativo = 1, data_atualizacao = NOW() WHERE id = $1 RETURNING id, nome, username, ativo',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para reativar.' });
        }
        res.status(200).json({ message: 'Usuário reativado com sucesso!', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao reativar o usuário.' });
    }
});

export default router;