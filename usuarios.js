import { Router } from 'express';
import { verifyJWT } from './authMiddleware.js';
import {
    createUser,
    getAllUsers,
    getUserById,
    getUsersByRole,
    updateUser,
    softDeleteUser,
    reactivateUser
} from './Controllers/userController.js';

const router = Router();

// CREATE - Criar um novo usuário (Exemplo: Apenas Admins podem criar)
// TODO: Adicionar verificação de papel (role check) se necessário
// Esta rota é pública para permitir o registro do primeiro usuário ou novos registros.
router.post('/', createUser);

// Aplica o middleware de autenticação para TODAS as rotas ABAIXO desta linha.
router.use(verifyJWT);

// READ - Obter todos os usuários
router.get('/', getAllUsers);

// READ - Rotas específicas por papel
// TODO: Substituir IDs hardcoded por uma busca na tabela 'papeis'
router.get('/alunos', getUsersByRole('900dd0cb-92c3-4cb6-8cf1-89bf38ade4a5')); // Substitua pelo seu UUID de Aluno
router.get('/professores', getUsersByRole('321f226b-f201-42a9-a0e5-6ef7c4990360')); // Substitua pelo seu UUID de Professor
router.get('/gestores', getUsersByRole('21787f01-b067-4249-80f5-9732bccf61c3')); // Substitua pelo seu UUID de Gestor
router.get('/admins', getUsersByRole('60577680-47a5-438a-839c-3b884537ea48')); // Substitua pelo seu UUID de Admin

// READ - Obter um usuário pelo ID
router.get('/:id', getUserById);

// UPDATE - Atualizar um usuário (parcialmente com PATCH)
router.patch('/:id', updateUser);

// DELETE - Desativar um usuário (Soft delete)
router.delete('/:id', softDeleteUser);

// PATCH - Reativar um usuário
router.patch('/:id/reactivate', reactivateUser);

export default router;