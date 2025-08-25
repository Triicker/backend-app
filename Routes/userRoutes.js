import express from 'express';
import {
    createUser,
    getAllUsers,
    getUserById,
    getUsersByRole,
    updateUser,
    softDeleteUser
} from '../controllers/userController.js';

const router = express.Router();

// CREATE
router.post('/', createUser);

// READ
router.get('/', getAllUsers);
router.get('/alunos', getUsersByRole(1));
router.get('/professores', getUsersByRole(2));
router.get('/gestores', getUsersByRole(3));
router.get('/admins', getUsersByRole(4));
router.get('/:id', getUserById); // Esta rota deve vir depois das específicas

// UPDATE & DELETE
router.put('/:id', updateUser);
router.delete('/:id', softDeleteUser);

export default router;

