import { Router } from 'express';
import {
    createVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo
} from '../controllers/videoController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas de vídeos, exceto a listagem, são protegidas
router.get('/', getAllVideos); // Rota pública para listar vídeos

router.use(verifyJWT); // Middleware de autenticação para as rotas abaixo

router.post('/', createVideo);
router.get('/:id', getVideoById);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);

export default router;