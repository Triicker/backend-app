import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

const router = Router();

// CREATE - Criar um novo usuário
router.post('/', async (req, res) => {
    const { nome, username, senha, id_papel, escola, matricula, ano, estado, cidade } = req.body;
    
    // IMPORTANTE: Em um ambiente de produção, a senha NUNCA deve ser armazenada em texto plano.
    // Use bcrypt para criar um hash da senha.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    try {
        const newUser = await pool.query(
            'INSERT INTO usuarios (nome, username, senha, id_papel, escola, matricula, ano, estado, cidade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, nome, username, data_criacao',
            [nome, username, hashedPassword, id_papel, escola, matricula, ano, estado, cidade]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao criar usuário', details: err.message });
    }
});

// READ - Obter todos os usuários (sem a senha)
router.get('/', async (req, res) => {
    try {
        const allUsers = await pool.query('SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao FROM usuarios ORDER BY nome');
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// READ - Obter um usuário pelo ID (sem a senha)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await pool.query('SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao FROM usuarios WHERE id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// UPDATE - Atualizar um usuário
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // A atualização de senha deve ser tratada com mais cuidado, talvez em um endpoint separado.
    const { nome, username, escola, matricula, ano, estado, cidade, id_papel } = req.body;
    try {
        const updatedUser = await pool.query(
            'UPDATE usuarios SET nome = $1, username = $2, escola = $3, matricula = $4, ano = $5, estado = $6, cidade = $7, id_papel = $8, data_atualizacao = NOW() WHERE id = $9 RETURNING id, nome, username',
            [nome, username, escola, matricula, ano, estado, cidade, id_papel, id]
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

// DELETE - Deletar um usuário
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // A tabela 'pontuacoes' tem 'ON DELETE CASCADE', então as pontuações serão removidas automaticamente.
        const deleteOp = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, nome', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para deletar' });
        }
        res.json({ message: `Usuário '${deleteOp.rows[0].nome}' deletado com sucesso!` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

export default router;