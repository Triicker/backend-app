import { Router } from 'express';
import {
    getDashboardOverview,
    getGameAnalytics,
    getUserAnalytics,
    getGamesPopularity,
    getEngagementReport,
    checkAndAwardBadges,
    saveGameSession,
    saveGamePlay,
    getDetailedRanking
} from '../controllers/analyticsController.js';
import { verifyJWT } from '../authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(verifyJWT);

// 📊 Dashboard e visões gerais
router.get('/dashboard', getDashboardOverview);
router.get('/games/popularity', getGamesPopularity);
router.get('/engagement', getEngagementReport);
router.get('/ranking/detailed', getDetailedRanking);

// 🎮 Analytics específicos
router.get('/games/:gameId', getGameAnalytics);
router.get('/users/:userId', getUserAnalytics);

// 🎯 Sistema de gamificação
router.post('/sessions', saveGameSession);
router.post('/game-play', saveGamePlay);
router.post('/badges/check/:userId', checkAndAwardBadges);

export default router;