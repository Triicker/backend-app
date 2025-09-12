import { Router } from 'express';
import { createEscola, getAllEscolas, getEscolaById, updateEscola, deleteEscola } from '../Controllers/escolaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control)

router.post('/', createEscola);
router.get('/', getAllEscolas);
router.get('/:id', getEscolaById);
router.put('/:id', updateEscola);
router.delete('/:id', deleteEscola);

export default router;