import { Router } from 'express';
import { assignConquista, getConquistasByUsuario, removeConquista } from '../Controllers/usuarioConquistaController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

router.use(verifyJWT);

// TODO: Adicionar verificação de papel (role-based access control)

// Atribui uma conquista a um usuário
router.post('/', assignConquista);

// Lista todas as conquistas de um usuário específico
router.get('/usuario/:id_usuario', getConquistasByUsuario);

// Remove um registro de conquista desbloqueada pelo seu ID único
router.delete('/:id', removeConquista);

export default router;