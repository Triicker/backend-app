import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/index.js';
import configureRoutes from './routes/index.js'; // Importa o configurador de rotas

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Configuração das Rotas da API ---
configureRoutes(app);

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
    db.testConnection(); // Testa a conexão com o banco após o servidor iniciar
});
