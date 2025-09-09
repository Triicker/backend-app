import { Router } from 'express';
import { createSala, getAllSalas, getSalasByEscola, getSalaById, updateSala, deleteSala } from '../../Controllers/salaController.js';
import { verifyJWT } from '../../authMiddleware.js';

const router = Router();

router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control)

router.post('/', createSala);
router.get('/', getAllSalas);
router.get('/escola/:id_escola', getSalasByEscola); // Rota útil para buscar salas de uma escola específica
router.get('/:id', getSalaById);
router.put('/:id', updateSala);
router.delete('/:id', deleteSala);

export default router;