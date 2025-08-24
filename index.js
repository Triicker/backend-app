import 'dotenv/config'; // Carrega as variáveis de ambiente do .env para process.env
import express from 'express';
import cors from 'cors';
import pg from 'pg';

// Extrai a classe Pool do pg
const { Pool } = pg;

// Cria a instância do Express
const app = express();
const port = process.env.PORT || 3001;

// --- Configuração da Conexão com o Banco de Dados ---
// A biblioteca 'pg' irá automaticamente usar as variáveis de ambiente que você definiu no .env
// (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT)
const pool = new Pool();

// Opcional: Bloco para testar a conexão com o banco de dados ao iniciar o servidor
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao adquirir cliente do pool de conexões', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // Libera o cliente de volta para o pool
        if (err) {
            return console.error('Erro ao executar a query de teste', err.stack);
        }
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
    });
});

// --- Middlewares ---
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// ==================================================
// --- ROTAS CRUD DE EXEMPLO (para uma tabela 'tasks') ---
// ==================================================

// CREATE: Criar uma nova tarefa
app.post('/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar a tarefa.' });
    }
});

// READ: Obter todas as tarefas
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar as tarefas.' });
    }
});

// READ: Obter uma tarefa por ID
app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar a tarefa.' });
    }
});

// UPDATE: Atualizar uma tarefa
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;

    try {
        const result = await pool.query(
            'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
            [title, completed, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar a tarefa.' });
    }
});

// DELETE: Deletar uma tarefa
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json({ message: 'Tarefa deletada com sucesso.', task: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao deletar a tarefa.' });
    }
});

// ==================================================
// --- ROTAS PARA A TABELA 'usuarios' ---
// ==================================================

// READ: Obter todos os usuários
app.get('/usuarios', async (req, res) => {
    try {
        // Altere 'usuarios' para o nome correto da sua tabela de usuários, se for diferente
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os usuários.' });
    }
});

// READ: Obter um usuário por ID
app.get('/usuarios/:id', async (req, res) => {
    const { id } = req.params; // Pega o 'id' da URL (ex: /usuarios/5)
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        // Verifica se a consulta retornou alguma linha
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.status(200).json(result.rows[0]); // Retorna o primeiro (e único) usuário encontrado
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar o usuário.' });
    }
});

// --- Inicia o servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
