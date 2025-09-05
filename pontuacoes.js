import { Router } from 'express';
import {
    createPontuacao,
    getAllPontuacoes,
    getPontuacoesByUsuario,
    updatePontuacao,
    deletePontuacao
} from './Controllers/pontuacaoController.js';
import { verifyJWT } from './authMiddleware.js';

const router = Router();

// Todas as rotas de pontuações requerem autenticação
router.use(verifyJWT);

// CREATE - Adicionar uma nova pontuação
router.post('/', createPontuacao);

// READ - Obter todas as pontuações
router.get('/', getAllPontuacoes);

// READ - Obter pontuações de um usuário específico
router.get('/usuario/:id_usuario', getPontuacoesByUsuario);

// UPDATE - Atualizar uma pontuação
router.put('/:id', updatePontuacao);

// DELETE - Deletar uma pontuação
router.delete('/:id', deletePontuacao);

export default router;
