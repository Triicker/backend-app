import { Router } from 'express';
import {
    createEscola,
    getAllEscolas,
    getInactiveEscolas,
    getEscolaById,
    updateEscola,
    softDeleteEscola,
    reactivateEscola
} from '../Controllers/escolaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de escolas requerem autenticação
router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control)

// CREATE
router.post('/', createEscola);
// READ
router.get('/', getAllEscolas);
router.get('/inativos', getInactiveEscolas);
router.get('/:id', getEscolaById);
// UPDATE
router.patch('/:id', updateEscola); // Alterado para PATCH para refletir atualização parcial
// SOFT DELETE & REACTIVATE
router.delete('/:id', softDeleteEscola); // Agora usa soft-delete
router.patch('/:id/reactivate', reactivateEscola);

export default router;