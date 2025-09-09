import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/index.js';
import usuariosRouter from './routes/usuariosRoutes.js'; // Importa o roteador de usuários
import authRouter from './Routes/routes/authRoutes.js'; // Importa o roteador de autenticação
import pontuacoesRouter from './Routes/routes/pontuacoesRoutes.js'; // Importa o roteador de pontuações
import cidadeRouter from './routes/cidadeRoutes.js'; // Importa o roteador de cidades
import escolaRouter from './routes/escolaRoutes.js'; // Importa o roteador de escolas
import salaRouter from './Routes/routes/salaRoutes.js'; // Importa o roteador de salas
import usuarioConquistaRouter from './routes/usuarioConquistaRoutes.js'; // Importa o roteador de usuarios_conquistas
import conquistaRouter from './routes/conquistaRoutes.js'; // Importa o roteador de conquistas
import jogoRouter from './routes/jogoRoutes.js'; // Importa o roteador de jogos
import papeisRouter from './routes/papeisRoutes.js'; // Importa o roteador de papéis

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

// Rotas de Autenticação
app.use('/auth', authRouter);

// Usa o roteador de usuários para todas as rotas que começam com /usuarios
app.use('/usuarios', usuariosRouter);

// Usa o roteador de pontuações
app.use('/pontuacoes', pontuacoesRouter);

// Usa o roteador de cidades
app.use('/cidades', cidadeRouter);

// Usa o roteador de escolas
app.use('/escolas', escolaRouter);

// Usa o roteador de salas
app.use('/salas', salaRouter);

// Usa o roteador de usuarios_conquistas
app.use('/usuarios-conquistas', usuarioConquistaRouter);

// Usa o roteador de conquistas
app.use('/conquistas', conquistaRouter);

// Usa o roteador de jogos
app.use('/jogos', jogoRouter);

// Usa o roteador de papéis
app.use('/papeis', papeisRouter);

// ==================================================
// --- Tratamento de Erros ---
// ==================================================
// Middleware de tratamento de erros. Deve ser o último middleware a ser adicionado.
app.use((err, req, res, next) => {
    console.error(err.stack); // Loga o stack trace do erro no console do servidor
    // Envia uma resposta de erro padronizada em JSON
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.', message: err.message });
});

// --- Inicia o servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
