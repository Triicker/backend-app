import { Router } from 'express';
import {
    createPontuacao,
    getAllPontuacoes,
    getPontuacoesByUsuario,
    getPontuacoesBySala,
    getRankingByJogo,
    getRankingByEscola,
    getRankingByCidade,
    getRankingByEstado,
    updatePontuacao,
    getUsuarioRankByJogo,
    deletePontuacao
} from '../../Controllers/pontuacaoController.js';
import { verifyJWT } from '../../authMiddleware.js';

const router = Router();

// Todas as rotas de pontuações requerem autenticação
router.use(verifyJWT);

// CREATE - Adicionar uma nova pontuação
router.post('/', createPontuacao);

// READ - Obter todas as pontuações
router.get('/', getAllPontuacoes);

// READ - Obter pontuações de um usuário específico
router.get('/usuario/:id_usuario', getPontuacoesByUsuario);

// READ - Obter pontuações de uma sala específica
router.get('/sala/:id_sala', getPontuacoesBySala);

// READ - Obter o ranking de um jogo específico
router.get('/ranking/jogo/:id_jogo', getRankingByJogo);

// READ - Obter o ranking de uma escola para um jogo
router.get('/ranking/escola/:id_escola/jogo/:id_jogo', getRankingByEscola);

// READ - Obter o ranking de uma cidade para um jogo
router.get('/ranking/cidade/:id_cidade/jogo/:id_jogo', getRankingByCidade);

// READ - Obter o ranking de um estado (regional) para um jogo
router.get('/ranking/estado/:estado/jogo/:id_jogo', getRankingByEstado);

// READ - Obter a posição de um usuário no ranking de um jogo
router.get('/ranking/usuario/:id_usuario/jogo/:id_jogo', getUsuarioRankByJogo);

// UPDATE - Atualizar uma pontuação
router.put('/:id', updatePontuacao);

// DELETE - Deletar uma pontuação
router.delete('/:id', deletePontuacao);

export default router;