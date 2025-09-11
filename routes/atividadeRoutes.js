import { Router } from 'express';
import {
    createAtividade,
    getAtividadesBySala,
    getAtividadesByProfessor,
    deleteAtividade,
    getAtividadesMinhaSala
} from '../controllers/atividadeController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de atividades requerem autenticação
router.use(verifyJWT);

// CREATE: Professor atribui um jogo a uma sala
// Futuramente, pode-se adicionar um middleware de verificação de papel (ex: isProfessor)
router.post('/', createAtividade);

// READ: Aluno logado vê as atividades da sua própria sala
router.get('/minha-sala', getAtividadesMinhaSala);

// READ: Alunos ou professores podem ver as atividades de uma sala
router.get('/sala/:id_sala', getAtividadesBySala);

// READ: Professor vê as atividades que ele mesmo criou
router.get('/professor/me', getAtividadesByProfessor);

// DELETE: Professor deleta uma atividade que ele criou
router.delete('/:id', deleteAtividade);

export default router;