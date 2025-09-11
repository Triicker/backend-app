import { Router } from 'express';
import {
    createJogo,
    getAllJogos,
    getJogoById,
    updateJogo,
    deleteJogo,
    getJogosParaAluno
} from '../Controllers/jogoController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de jogos requerem autenticação
router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control) para rotas de escrita

// Rota específica para a visão do aluno logado
router.get('/para-aluno', getJogosParaAluno);

router.post('/', createJogo);
router.get('/', getAllJogos);
router.get('/:id', getJogoById);
router.put('/:id', updateJogo);
router.delete('/:id', deleteJogo);

export default router;