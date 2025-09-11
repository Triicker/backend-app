import { Router } from 'express';
import {
    createAno,
    getAllAnos,
    getAnoById,
    updateAno,
    deleteAno,
    getJogosByAno
} from '../Controllers/anoController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Rotas públicas para listagem e visualização
router.get('/', getAllAnos);
router.get('/:id', getAnoById);
router.get('/:id/jogos', getJogosByAno);

// Rotas de escrita protegidas por autenticação
router.use(verifyJWT);
router.post('/', createAno);
router.put('/:id', updateAno);
router.delete('/:id', deleteAno);

export default router;