import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Importa o pacote cors
import db from './db/index.js'; // Importa a configuração centralizada do banco de dados
import bcrypt from 'bcrypt'; // Importa o bcrypt para hashear senhas
import jwt from 'jsonwebtoken'; // Importa o jsonwebtoken para criar tokens

// ==================================================
// --- Middleware de Autenticação ---
// ==================================================
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        // Adiciona os dados do usuário decodificados ao objeto da requisição
        req.user = decoded;
        next();
    });
};

const app = express();
const port = process.env.PORT || 3000; // Alterado para a porta 3000

// ==================================================
// --- Middlewares ---
// ==================================================

// É CRUCIAL que o middleware do CORS venha ANTES das suas rotas.
// app.use(cors()) habilita o CORS para TODAS as origens, o que é ideal para desenvolvimento.
app.use(cors());

// Habilita o parsing de JSON no corpo das requisições
app.use(express.json());


// ==================================================
// --- Rotas da API ---
// ==================================================

// Rota de "Health Check" para testar se o servidor está no ar
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API está no ar!' });
});

// Rota de Login
app.post('/auth/login', async (req, res) => {
    const { username, senha } = req.body;

    if (!username || !senha) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        // 1. Buscar o usuário pelo username
        const userQuery = 'SELECT * FROM usuarios WHERE username = $1 AND ativo = true';
        const result = await db.query(userQuery, [username]);
        const user = result.rows[0];

        // 2. Verificar se o usuário existe e se a senha está correta
        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            // Mensagem de erro genérica para segurança
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 3. Gerar o token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, id_papel: user.id_papel },
            process.env.JWT_SECRET, // Certifique-se de que JWT_SECRET está no seu .env
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        // 4. Remover a senha do objeto do usuário antes de enviar a resposta
        delete user.senha;
        res.status(200).json({ user, token });
    } catch (error) {
        console.error('Erro no processo de login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// CREATE: Cadastrar um novo usuário
app.post('/usuarios', async (req, res) => {
    // Extrai todos os campos do corpo da requisição
    const { nome, username, senha, id_papel, escola, matricula, ano, estado, cidade } = req.body;

    // Validação básica
    if (!nome || !username || !senha || !id_papel) {
        return res.status(400).json({ error: 'Campos nome, username, senha e id_papel são obrigatórios.' });
    }

    try {
        // Gera um "hash" seguro da senha. O segundo argumento é o "custo" do hash. 10 é um bom padrão.
        const hashedPassword = await bcrypt.hash(senha, 10);

        const newUserQuery = `
            INSERT INTO usuarios (nome, username, senha, id_papel, escola, matricula, ano, estado, cidade)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, nome, username, id_papel, data_criacao;
        `;
        
        const values = [nome, username, hashedPassword, id_papel, escola, matricula, ano, estado, cidade];

        const result = await db.query(newUserQuery, values);

        // Retorna o usuário criado (sem a senha) com status 201 (Created)
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Código '23505' no PostgreSQL significa violação de chave única (ex: username duplicado)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'O nome de usuário já existe.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar o usuário.' });
    }
});

// READ: Obter todos os usuários
app.get('/usuarios', verifyJWT, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao FROM usuarios WHERE ativo = true ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os usuários.' });
    }
});

// READ: Obter todos os Alunos (id_papel = 1)
app.get('/usuarios/alunos', verifyJWT, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nome, username, escola, matricula, ano FROM usuarios WHERE id_papel = 1 AND ativo = true ORDER BY nome ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os alunos.' });
    }
});

// READ: Obter todos os Professores (id_papel = 2)
app.get('/usuarios/professores', verifyJWT, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nome, username, escola FROM usuarios WHERE id_papel = 2 AND ativo = true ORDER BY nome ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os professores.' });
    }
});

// READ: Obter todos os Gestores (id_papel = 3)
app.get('/usuarios/gestores', verifyJWT, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nome, username FROM usuarios WHERE id_papel = 3 AND ativo = true ORDER BY nome ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os gestores.' });
    }
});

// READ: Obter todos os Admins (id_papel = 4)
app.get('/usuarios/admins', verifyJWT, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nome, username FROM usuarios WHERE id_papel = 4 AND ativo = true ORDER BY nome ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os administradores.' });
    }
});

// READ: Obter um usuário por ID
app.get('/usuarios/:id', verifyJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT id, nome, username, id_papel, escola, matricula, ano, estado, cidade, data_criacao FROM usuarios WHERE id = $1 AND ativo = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar o usuário.' });
    }
});

// UPDATE: Atualizar um usuário por ID
app.put('/usuarios/:id', verifyJWT, async (req, res) => {
    const { id } = req.params;
    const { nome, username, senha, id_papel, escola, matricula, ano, estado, cidade } = req.body;

    try {
        let hashedPassword;
        if (senha) {
            // Se uma nova senha foi fornecida, crie o hash dela
            hashedPassword = await bcrypt.hash(senha, 10);
        }

        // Constrói a query de atualização dinamicamente para não sobrescrever campos com null
        const fields = { nome, username, senha: hashedPassword, id_papel, escola, matricula, ano, estado, cidade };
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

        // Adiciona a atualização da data e o ID do usuário aos parâmetros
        queryParts.push(`data_atualizacao = NOW()`);
        values.push(id);

        const updateQuery = `UPDATE usuarios SET ${queryParts.join(', ')} WHERE id = $${paramIndex} AND ativo = true RETURNING *;`;

        const result = await db.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
        }

        // Remove a senha do objeto de resposta por segurança
        delete result.rows[0].senha;
        res.status(200).json(result.rows[0]);

    } catch (error) {
        // Código '23505' no PostgreSQL significa violação de chave única (ex: username duplicado)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'O nome de usuário já existe.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar o usuário.' });
    }
});

// DELETE: Desativar um usuário (Soft Delete)
app.delete('/usuarios/:id', verifyJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE usuarios SET ativo = false, data_atualizacao = NOW() WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Usuário desativado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao desativar o usuário.' });
    }
});

// --- Inicia o servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});