import { Router } from 'express';
import {
    createConquista,
    getAllConquistas,
    getConquistaById,
    updateConquista,
    deleteConquista
} from '../Controllers/conquistaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de conquistas requerem autenticação
router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control) para rotas de escrita

router.post('/', createConquista);
router.get('/', getAllConquistas);
router.get('/:id', getConquistaById);
router.put('/:id', updateConquista);
router.delete('/:id', deleteConquista);

export default router;