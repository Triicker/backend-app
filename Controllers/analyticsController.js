import db from '../db/index.js';

// 📊 DASHBOARD ANALYTICS - Visão geral do sistema (usando dados existentes)
export const getDashboardOverview = async (req, res, next) => {
    try {
        const overview = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE id_papel::text = '900dd0cb-92c3-4cb6-8cf1-89bf38ade4a5') as total_alunos,
                (SELECT COUNT(*) FROM usuarios WHERE id_papel::text = '321f226b-f201-42a9-a0e5-6ef7c4990360') as total_professores,
                (SELECT COUNT(*) FROM jogos) as total_jogos,
                (SELECT COUNT(*) FROM pontuacoes WHERE DATE(data_registro) = CURRENT_DATE) as jogos_hoje,
                (SELECT COUNT(*) FROM pontuacoes WHERE data_registro >= CURRENT_DATE - INTERVAL '7 days') as jogos_semana,
                (SELECT COUNT(DISTINCT id_usuario) FROM pontuacoes WHERE data_registro >= CURRENT_DATE - INTERVAL '30 days') as usuarios_ativos_mes,
                (SELECT ROUND(AVG(pontuacao), 2) FROM pontuacoes WHERE pontuacao IS NOT NULL) as pontuacao_media_geral,
                (SELECT COUNT(*) FROM usuarios_conquistas) as total_conquistas_concedidas
        `);
        
        res.json(overview.rows[0]);
    } catch (error) {
        next(error);
    }
};

// 🎮 ANALYTICS POR JOGO (usando tabela de pontuações existente)
export const getGameAnalytics = async (req, res, next) => {
    const { gameId } = req.params;
    
    try {
        const analytics = await db.query(`
            SELECT 
                j.nome as game_name,
                COUNT(p.id) as total_plays,
                COUNT(DISTINCT p.id_usuario) as unique_players,
                ROUND(AVG(p.pontuacao), 2) as average_score,
                MAX(p.pontuacao) as best_score,
                MIN(p.data_registro) as first_played,
                MAX(p.data_registro) as last_played
            FROM jogos j
            LEFT JOIN pontuacoes p ON j.id::text = p.id_jogo::text
            WHERE j.id::text = $1
            GROUP BY j.id, j.nome
        `, [gameId]);
        
        // Top players do jogo
        const topPlayers = await db.query(`
            SELECT 
                u.nome as player_name,
                COUNT(p.id) as plays,
                MAX(p.pontuacao) as best_score,
                ROUND(AVG(p.pontuacao), 2) as avg_score
            FROM pontuacoes p
            JOIN usuarios u ON p.id_usuario::text = u.id::text
            WHERE p.id_jogo::text = $1
            GROUP BY u.id, u.nome
            ORDER BY best_score DESC
            LIMIT 10
        `, [gameId]);
        
        res.json({
            overview: analytics.rows[0],
            difficulty_stats: difficultyStats.rows,
            top_players: topPlayers.rows
        });
    } catch (error) {
        next(error);
    }
};

// 👤 ANALYTICS POR USUÁRIO
export const getUserAnalytics = async (req, res, next) => {
    const { userId } = req.params;
    
    try {
        // Visão geral do usuário (usando pontuações ao invés de game_sessions)
        const userOverview = await db.query(`
            SELECT 
                u.nome,
                u.username,
                u.ano,
                COUNT(DISTINCT p.id) as total_sessions,
                COUNT(DISTINCT p.id_jogo) as unique_games,
                ROUND(AVG(p.pontuacao), 2) as average_score,
                MAX(p.pontuacao) as best_score,
                MIN(p.data_registro) as first_play,
                MAX(p.data_registro) as last_activity
            FROM usuarios u
            LEFT JOIN pontuacoes p ON u.id::text = p.id_usuario::text
            WHERE u.id::text = $1
            GROUP BY u.id, u.nome, u.username, u.ano
        `, [userId]);
        
        // Progresso por disciplina (usando pontuações existentes)
        const disciplineProgress = await db.query(`
            SELECT 
                COALESCE(d.nome, 'Sem disciplina') as disciplina,
                COUNT(p.id) as games_played,
                ROUND(AVG(p.pontuacao), 2) as average_score,
                MAX(p.pontuacao) as best_score,
                MIN(p.data_registro) as first_played,
                MAX(p.data_registro) as last_played
            FROM pontuacoes p
            JOIN jogos j ON p.id_jogo::text = j.id::text
            LEFT JOIN jogos_disciplinas jd ON j.id::text = jd.id_jogo::text
            LEFT JOIN disciplinas d ON jd.id_disciplina::text = d.id::text
            WHERE p.id_usuario::text = $1
            GROUP BY d.nome
            ORDER BY average_score DESC
        `, [userId]);
        
        // Conquistas do usuário (usando tabela existente)
        const badges = await db.query(`
            SELECT 
                c.nome as conquista_nome,
                c.descricao,
                uc.data_obtencao as earned_at
            FROM usuarios_conquistas uc
            JOIN conquistas c ON uc.id_conquista::text = c.id::text
            WHERE uc.id_usuario::text = $1
            ORDER BY uc.data_obtencao DESC
        `, [userId]);
        
        // Jogos favoritos (mais jogados usando pontuações)
        const favoriteGames = await db.query(`
            SELECT 
                j.nome as game_name,
                COUNT(p.id) as plays,
                ROUND(AVG(p.pontuacao), 2) as avg_score,
                MAX(p.pontuacao) as best_score
            FROM pontuacoes p
            JOIN jogos j ON p.id_jogo::text = j.id::text
            WHERE p.id_usuario::text = $1
            GROUP BY j.id, j.nome
            ORDER BY plays DESC
            LIMIT 5
        `, [userId]);
        
        res.json({
            overview: userOverview.rows[0] || {},
            discipline_progress: disciplineProgress.rows || [],
            badges: badges.rows || [],
            favorite_games: favoriteGames.rows || []
        });
    } catch (error) {
        next(error);
    }
};

// 📈 ANALYTICS DE POPULARIDADE DE JOGOS (usando dados existentes)
export const getGamesPopularity = async (req, res, next) => {
    try {
        const popularity = await db.query(`
            SELECT 
                j.nome as game_name,
                j.id as game_id,
                COUNT(p.id) as total_plays,
                COUNT(DISTINCT p.id_usuario) as unique_players,
                ROUND(AVG(p.pontuacao), 2) as average_score,
                MAX(p.pontuacao) as best_score,
                MIN(p.data_registro) as first_played,
                MAX(p.data_registro) as last_played,
                COALESCE(d.nome, 'Sem disciplina') as disciplina_nome
            FROM jogos j
            LEFT JOIN pontuacoes p ON j.id::text = p.id_jogo::text
            LEFT JOIN jogos_disciplinas jd ON j.id::text = jd.id_jogo::text
            LEFT JOIN disciplinas d ON jd.id_disciplina::text = d.id::text
            GROUP BY j.id, j.nome, d.nome
            HAVING COUNT(p.id) > 0
            ORDER BY total_plays DESC, average_score DESC
            LIMIT 20
        `);
        
        res.json(popularity.rows);
    } catch (error) {
        next(error);
    }
};

// 📊 RELATÓRIO DE ENGAJAMENTO POR PERÍODO (usando dados existentes)
export const getEngagementReport = async (req, res, next) => {
    const { startDate, endDate, disciplinaId, anoId } = req.query;
    
    try {
        let query = `
            SELECT 
                DATE(p.data_registro) as date,
                COUNT(DISTINCT p.id_usuario) as unique_users,
                COUNT(p.id) as total_sessions,
                ROUND(AVG(p.pontuacao), 2) as avg_score,
                COUNT(DISTINCT j.id) as games_played,
                COALESCE(d.nome, 'Todas') as disciplina_nome
            FROM pontuacoes p
            JOIN jogos j ON p.id_jogo::text = j.id::text
            JOIN usuarios u ON p.id_usuario::text = u.id::text
            LEFT JOIN jogos_disciplinas jd ON j.id::text = jd.id_jogo::text
            LEFT JOIN disciplinas d ON jd.id_disciplina::text = d.id::text
        `;
        
        const conditions = [];
        const params = [];
        
        if (startDate) {
            conditions.push(`p.data_registro >= $${params.push(startDate)}`);
        }
        if (endDate) {
            conditions.push(`p.data_registro <= $${params.push(endDate)}`);
        }
        if (anoId) {
            query += ` LEFT JOIN jogos_anos ja ON j.id::text = ja.id_jogo::text`;
            conditions.push(`ja.id_ano::text = $${params.push(anoId)}`);
        }
        if (disciplinaId) {
            conditions.push(`jd.id_disciplina::text = $${params.push(disciplinaId)}`);
        }
        
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` GROUP BY DATE(p.data_registro), d.nome ORDER BY date DESC`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

// 🎯 SISTEMA DE CONQUISTAS (simplificado para usar tabelas existentes)
export const checkAndAwardBadges = async (req, res, next) => {
    const { userId } = req.params;
    
    try {
        // Retorna conquistas já obtidas pelo usuário usando sistema existente
        const existingBadges = await db.query(`
            SELECT 
                c.nome as badge_name,
                c.descricao as description,
                uc.data_obtencao as earned_at
            FROM usuarios_conquistas uc
            JOIN conquistas c ON uc.id_conquista::text = c.id::text
            WHERE uc.id_usuario::text = $1
            ORDER BY uc.data_obtencao DESC
        `, [userId]);
        
        res.json({ 
            existing_badges: existingBadges.rows,
            message: 'Sistema usando conquistas existentes'
        });
    } catch (error) {
        next(error);
    }
};

// 📝 SALVAR SESSÃO DE JOGO (redirecionado para pontuações existentes)
export const saveGameSession = async (req, res, next) => {
    const { id_jogo, score, id_usuario } = req.body;
    
    try {
        // Salva na tabela de pontuações existente
        const result = await db.query(`
            INSERT INTO pontuacoes (id_usuario, id_jogo, pontuacao, data_registro)
            VALUES ($1, $2, $3, NOW())
            RETURNING id
        `, [id_usuario, id_jogo, score || 0]);
        
        res.status(201).json({ 
            session_id: result.rows[0].id,
            message: 'Pontuação salva com sucesso!'
        });
    } catch (error) {
        next(error);
    }
};

// 📊 RANKING GERAL COM MAIS DETALHES (usando dados existentes)
export const getDetailedRanking = async (req, res, next) => {
    const { disciplinaId, anoId, limit = 50 } = req.query;
    
    try {
        let query = `
            SELECT 
                u.id,
                u.nome,
                COALESCE(e.nome, 'Sem escola') as escola,
                COALESCE(s.nome, 'Sem sala') as sala,
                u.ano,
                COUNT(DISTINCT p.id) as jogos_realizados,
                ROUND(AVG(p.pontuacao), 2) as media_pontuacao,
                MAX(p.pontuacao) as melhor_pontuacao,
                MIN(p.data_registro) as primeira_partida,
                MAX(p.data_registro) as ultima_partida,
                COUNT(DISTINCT uc.id) as conquistas_obtidas,
                COUNT(DISTINCT j.id) as jogos_diferentes
            FROM usuarios u
            LEFT JOIN escolas e ON u.id_escola::text = e.id::text
            LEFT JOIN salas s ON u.id_sala::text = s.id::text
            LEFT JOIN pontuacoes p ON u.id::text = p.id_usuario::text
            LEFT JOIN usuarios_conquistas uc ON u.id::text = uc.id_usuario::text
            LEFT JOIN jogos j ON p.id_jogo::text = j.id::text
        `;
        
        const conditions = [`u.id_papel::text = '900dd0cb-92c3-4cb6-8cf1-89bf38ade4a5'`]; // Apenas alunos
        const params = [];
        
        if (anoId) {
            conditions.push(`u.ano = $${params.push(anoId)}`);
        }
        
        if (disciplinaId) {
            query += ` LEFT JOIN jogos_disciplinas jdr ON j.id::text = jdr.id_jogo::text`;
            conditions.push(`jdr.id_disciplina::text = $${params.push(disciplinaId)}`);
        }
        
        query += ` WHERE ${conditions.join(' AND ')}`;
        query += ` GROUP BY u.id, u.nome, e.nome, s.nome, u.ano`;
        query += ` ORDER BY media_pontuacao DESC, jogos_realizados DESC`;
        query += ` LIMIT $${params.push(limit)}`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

// 💾 SALVAR DADOS DE JOGADA (nova tabela game_plays) 
export const saveGamePlay = async (req, res, next) => {
    const { id_usuario, id_jogo, pontuacao, tempo_jogado, completou, dados_extras } = req.body;
    
    try {
        const result = await db.query(`
            SELECT save_game_play($1, $2, $3, $4, $5, $6) as play_id
        `, [id_usuario, id_jogo, pontuacao, tempo_jogado, completou, dados_extras || {}]);
        
        console.log(`[Analytics] 🎮 Nova jogada salva: ${result.rows[0].play_id}`);
        
        res.status(201).json({
            success: true,
            play_id: result.rows[0].play_id,
            message: 'Dados da jogada salvos com sucesso!'
        });
    } catch (error) {
        console.error('[Analytics] ❌ Erro ao salvar jogada:', error);
        next(error);
    }
};

export default {
    getDashboardOverview,
    getGameAnalytics,
    getUserAnalytics,
    getGamesPopularity,
    getEngagementReport,
    checkAndAwardBadges,
    saveGameSession,
    saveGamePlay,
    getDetailedRanking
};