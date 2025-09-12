import { Router } from 'express';
import { verifyJWT } from '../authMiddleware.js';
import {
    createUser,
    getAllUsers,
    getInactiveUsers,
    getUserById,
    getUsersByRole,
    updateUser,
    softDeleteUser,
    reactivateUser
} from '../controllers/userController.js';
import { getConquistasByUsuario } from '../controllers/usuarioConquistaController.js';

const router = Router();

// CREATE - Criar um novo usuário
// Esta rota é pública para permitir o registro de novos usuários.
router.post('/', createUser);

// Aplica o middleware de autenticação para TODAS as rotas ABAIXO desta linha.
router.use(verifyJWT);

// --- ROTAS DE LEITURA (READ) ---
// Obter todos os usuários ativos
router.get('/', getAllUsers);
// Obter todos os usuários inativos
router.get('/inativos', getInactiveUsers); 

// Rotas específicas por papel (devem vir antes de /:id para evitar conflitos)
router.get('/alunos', getUsersByRole('900dd0cb-92c3-4cb6-8cf1-89bf38ade4a5'));
router.get('/professores', getUsersByRole('321f226b-f201-42a9-a0e5-6ef7c4990360'));
router.get('/gestores', getUsersByRole('21787f01-b067-4249-80f5-9732bccf61c3'));
router.get('/admins', getUsersByRole('60577680-47a5-438a-839c-3b884537ea48'));

// Obter as conquistas de um usuário (deve vir antes de /:id)
router.get('/:id/conquistas', getConquistasByUsuario);

// Obter um usuário pelo ID (rota mais genérica, fica por último entre os GETs)
router.get('/:id', getUserById);

// --- ROTAS DE ESCRITA (WRITE) ---
// Atualizar um usuário (parcialmente com PATCH)
router.patch('/:id', updateUser);

// DELETE - Desativar um usuário (Soft delete)
router.delete('/:id', softDeleteUser);

// PATCH - Reativar um usuário
router.patch('/:id/reactivate', reactivateUser);

export default router;