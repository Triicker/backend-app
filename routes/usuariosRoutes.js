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
} from '../Controllers/userController.js';
import { getConquistasByUsuario } from '../Controllers/usuarioConquistaController.js';

const router = Router();

// CREATE - Criar um novo usuário
// Esta rota é pública para permitir o registro de novos usuários.
router.post('/', createUser);

// Aplica o middleware de autenticação para TODAS as rotas ABAIXO desta linha.
router.use(verifyJWT);

// READ - Obter todos os usuários
router.get('/', getAllUsers);
router.get('/inativos', getInactiveUsers); 
router.get('/:id', getUserById);

// READ - Rotas específicas por papel
router.get('/alunos', getUsersByRole('900dd0cb-92c3-4cb6-8cf1-89bf38ade4a5'));
router.get('/professores', getUsersByRole('321f226b-f201-42a9-a0e5-6ef7c4990360'));
router.get('/gestores', getUsersByRole('21787f01-b067-4249-80f5-9732bccf61c3'));
router.get('/admins', getUsersByRole('60577680-47a5-438a-839c-3b884537ea48'));

// READ - Obter um usuário pelo ID
router.get('/:id', getUserById);


// READ - Obter as conquistas de um usuário pelo ID do usuário
router.get('/:id/conquistas', getConquistasByUsuario);

// UPDATE - Atualizar um usuário (parcialmente com PATCH)
router.patch('/:id', updateUser);

// DELETE - Desativar um usuário (Soft delete)
router.delete('/:id', softDeleteUser);

// PATCH - Reativar um usuário
router.patch('/:id/reactivate', reactivateUser);

export default router;