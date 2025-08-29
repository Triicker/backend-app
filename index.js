import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyJWT } from './authMiddleware.js'; // Importa o middleware
import usuariosRouter from './usuarios.js'; // Importa o roteador de usuários

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==================================================
// --- Rotas da API ---
// ==================================================

// Rota de "Health Check"
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
        const userQuery = 'SELECT * FROM usuarios WHERE username = $1 AND ativo = 1';
        const result = await db.query(userQuery, [username]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, id_papel: user.id_papel },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        delete user.senha;
        res.status(200).json({ user, token });
    } catch (error) {
        console.error('Erro no processo de login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Usa o roteador de usuários para todas as rotas que começam com /usuarios
app.use('/usuarios', usuariosRouter);

// --- Inicia o servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
