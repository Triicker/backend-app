import { Router } from 'express';
import { createCidade, getAllCidades, getCidadeById, updateCidade, deleteCidade } from '../controllers/cidadeController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de cidades requerem autenticação
router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control) para rotas de escrita (POST, PUT, DELETE)

router.post('/', createCidade);
router.get('/', getAllCidades);
router.get('/:id', getCidadeById);
router.put('/:id', updateCidade);
router.delete('/:id', deleteCidade);

export default router;