import usuariosRouter from './usuariosRoutes.js';
import authRouter from './authRoutes.js';
import pontuacoesRouter from './pontuacoesRoutes.js';
import cidadeRouter from './cidadeRoutes.js';
import escolaRouter from './escolaRoutes.js';
import salaRouter from './salaRoutes.js';
import usuarioConquistaRouter from './usuarioConquistaRoutes.js';
import conquistaRouter from './conquistaRoutes.js';
import disciplinaRouter from './disciplinaRoutes.js';
import anoRouter from './anoRoutes.js';
import atividadeRouter from './atividadeRoutes.js';
import jogoRouter from './jogoRoutes.js';
import videoRouter from './videoRoutes.js';
import papeisRouter from './papeisRoutes.js';

const configureRoutes = (app) => {
    // Rota de "Health Check" para verificar se a API está no ar
    app.get('/', (req, res) => {
        res.status(200).json({ status: 'ok', message: 'API está no ar!' });
    });

    // Registra todas as rotas da aplicação
    app.use('/auth', authRouter);
    app.use('/usuarios', usuariosRouter);
    app.use('/pontuacoes', pontuacoesRouter);
    app.use('/cidades', cidadeRouter);
    app.use('/escolas', escolaRouter);
    app.use('/salas', salaRouter);
    app.use('/usuarios-conquistas', usuarioConquistaRouter);
    app.use('/conquistas', conquistaRouter);
    app.use('/disciplinas', disciplinaRouter);
    app.use('/anos', anoRouter);
    app.use('/atividades', atividadeRouter);
    app.use('/jogos', jogoRouter);
    app.use('/videos', videoRouter);
    app.use('/papeis', papeisRouter);
};

export default configureRoutes;