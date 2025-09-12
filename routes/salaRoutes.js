import { Router } from 'express';
import {
    createSala,
    getAllSalas,
    getSalasByEscola,
    getSalaById,
    updateSala,
    deleteSala,
    getSalasMinhaEscola,
} from '../controllers/salaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// A partir daqui, todas as rotas exigem autenticação
router.use(verifyJWT);

// CREATE
router.post('/', createSala);

// READ
router.get('/', getAllSalas);
// Rota para o professor/gestor ver as salas da sua própria escola
router.get('/minha-escola', getSalasMinhaEscola);
router.get('/escola/:id_escola', getSalasByEscola);
router.get('/:id', getSalaById);

// UPDATE
router.put('/:id', updateSala);
// DELETE
router.delete('/:id', deleteSala);

export default router;