import { Router } from 'express';
import {
    createDisciplina,
    getAllDisciplinas,
    getDisciplinaById,
    updateDisciplina,
    deleteDisciplina,
    getJogosByDisciplina
} from '../Controllers/disciplinaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Rotas públicas para listagem e visualização
router.get('/', getAllDisciplinas);
router.get('/:id', getDisciplinaById);
router.get('/:id/jogos', getJogosByDisciplina);

// Rotas de escrita protegidas por autenticação e, futuramente, por papel (admin/gestor)
router.use(verifyJWT);
router.post('/', createDisciplina);
router.put('/:id', updateDisciplina);
router.delete('/:id', deleteDisciplina);

export default router;