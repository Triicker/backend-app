-- =====================================================
-- SCRIPT CORRIGIDO - ANALYTICS PARA GAMIFICAÇÃO
-- =====================================================

-- Primeiro, vamos verificar e corrigir a estrutura da tabela usuarios se necessário
DO $$
BEGIN
    -- Verificar se existe a coluna id_ano, se não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'id_ano'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN id_ano UUID REFERENCES anos(id);
        RAISE NOTICE 'Coluna id_ano adicionada à tabela usuarios';
    END IF;
END $$;

-- =====================================================
-- SCHEMA DE ANALYTICS PARA GAMIFICAÇÃO
-- =====================================================

-- 1. Tabela de sessões de jogo (tracking detalhado)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_jogo UUID NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER, -- Duração calculada
    score INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    difficulty_level VARCHAR(20), -- 'facil', 'medio', 'dificil', 'muito_dificil'
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de eventos detalhados (clickstream)
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'question_answered', 'hint_used', 'game_paused', etc.
    event_data JSONB, -- Dados flexíveis do evento
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de progresso do usuário por disciplina
CREATE TABLE IF NOT EXISTS user_discipline_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_disciplina UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    games_completed INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_played_at TIMESTAMP,
    level_reached INTEGER DEFAULT 1, -- Sistema de níveis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_disciplina)
);

-- 4. Tabela de badges/conquistas customizadas
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'streak_master', 'perfect_score', 'speed_demon', etc.
    badge_data JSONB, -- Metadados do badge
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_jogo UUID REFERENCES jogos(id), -- Badge específico de um jogo (opcional)
    id_disciplina UUID REFERENCES disciplinas(id) -- Badge específico de disciplina (opcional)
);

-- 5. Tabela de streaks (sequências)
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    streak_type VARCHAR(30) NOT NULL, -- 'daily_play', 'perfect_answers', etc.
    current_count INTEGER DEFAULT 0,
    max_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, streak_type)
);

-- 6. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_usuario ON game_sessions(id_usuario);
CREATE INDEX IF NOT EXISTS idx_game_sessions_jogo ON game_sessions(id_jogo);
CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_game_events_session ON game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_usuario ON user_discipline_progress(id_usuario);
CREATE INDEX IF NOT EXISTS idx_user_badges_usuario ON user_badges(id_usuario);
CREATE INDEX IF NOT EXISTS idx_user_streaks_usuario ON user_streaks(id_usuario);

-- 7. Views úteis para analytics (corrigidas)
CREATE OR REPLACE VIEW v_user_analytics AS
SELECT 
    u.id as user_id,
    u.nome as user_name,
    u.id_papel,
    u.id_ano,
    COUNT(DISTINCT gs.id) as total_sessions,
    COUNT(DISTINCT gs.id_jogo) as unique_games_played,
    COALESCE(AVG(gs.score), 0) as average_score,
    COALESCE(SUM(gs.duration_seconds)/60, 0) as total_time_minutes,
    COUNT(DISTINCT DATE(gs.started_at)) as active_days,
    MAX(gs.started_at) as last_activity
FROM usuarios u
LEFT JOIN game_sessions gs ON u.id = gs.id_usuario
GROUP BY u.id, u.nome, u.id_papel, u.id_ano;

CREATE OR REPLACE VIEW v_game_popularity AS
SELECT 
    j.id as game_id,
    j.nome as game_name,
    COUNT(gs.id) as total_plays,
    COUNT(DISTINCT gs.id_usuario) as unique_players,
    COALESCE(AVG(gs.score), 0) as average_score,
    COALESCE(AVG(gs.duration_seconds)/60, 0) as average_duration_minutes,
    COUNT(CASE WHEN gs.completed = true THEN 1 END) as completion_count,
    CASE 
        WHEN COUNT(gs.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN gs.completed = true THEN 1 END)::DECIMAL / COUNT(gs.id)) * 100, 2)
        ELSE 0 
    END as completion_rate
FROM jogos j
LEFT JOIN game_sessions gs ON j.id = gs.id_jogo
GROUP BY j.id, j.nome
ORDER BY total_plays DESC;

-- 8. Função para calcular streak diário (corrigida)
CREATE OR REPLACE FUNCTION update_daily_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    max_streak INTEGER := 0;
BEGIN
    -- Verificar se jogou hoje
    IF EXISTS (
        SELECT 1 FROM game_sessions 
        WHERE id_usuario = user_id 
        AND DATE(started_at) = CURRENT_DATE
    ) THEN
        -- Buscar streak atual
        SELECT COALESCE(current_count, 0), COALESCE(max_count, 0) 
        INTO current_streak, max_streak
        FROM user_streaks 
        WHERE id_usuario = user_id AND streak_type = 'daily_play';
        
        -- Se não existe, criar
        IF current_streak = 0 THEN
            current_streak := 1;
            max_streak := 1;
            INSERT INTO user_streaks (id_usuario, streak_type, current_count, max_count)
            VALUES (user_id, 'daily_play', 1, 1)
            ON CONFLICT (id_usuario, streak_type) DO UPDATE SET
                current_count = 1,
                max_count = GREATEST(user_streaks.max_count, 1),
                last_updated = CURRENT_TIMESTAMP;
        ELSE
            -- Verificar se jogou ontem (continuidade do streak)
            IF EXISTS (
                SELECT 1 FROM game_sessions 
                WHERE id_usuario = user_id 
                AND DATE(started_at) = CURRENT_DATE - INTERVAL '1 day'
            ) THEN
                current_streak := current_streak + 1;
                max_streak := GREATEST(max_streak, current_streak);
            ELSE
                current_streak := 1; -- Reset streak
            END IF;
            
            UPDATE user_streaks 
            SET current_count = current_streak, 
                max_count = max_streak,
                last_updated = CURRENT_TIMESTAMP
            WHERE id_usuario = user_id AND streak_type = 'daily_play';
        END IF;
    END IF;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar progresso automaticamente (corrigido)
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar progresso por disciplina
    INSERT INTO user_discipline_progress (
        id_usuario, id_disciplina, games_played, games_completed, 
        total_score, time_spent_minutes, last_played_at
    )
    SELECT 
        NEW.id_usuario,
        jd.id_disciplina,
        1,
        CASE WHEN NEW.completed THEN 1 ELSE 0 END,
        COALESCE(NEW.score, 0),
        COALESCE(NEW.duration_seconds, 0) / 60,
        NEW.started_at
    FROM jogos_disciplinas jd 
    WHERE jd.id_jogo = NEW.id_jogo
    ON CONFLICT (id_usuario, id_disciplina) 
    DO UPDATE SET
        games_played = user_discipline_progress.games_played + 1,
        games_completed = user_discipline_progress.games_completed + 
            CASE WHEN NEW.completed THEN 1 ELSE 0 END,
        total_score = user_discipline_progress.total_score + COALESCE(NEW.score, 0),
        average_score = CASE 
            WHEN (user_discipline_progress.games_played + 1) > 0 THEN
                ROUND((user_discipline_progress.total_score + COALESCE(NEW.score, 0))::DECIMAL / 
                      (user_discipline_progress.games_played + 1), 2)
            ELSE 0 
        END,
        time_spent_minutes = user_discipline_progress.time_spent_minutes + 
            COALESCE(NEW.duration_seconds, 0) / 60,
        last_played_at = NEW.started_at,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Atualizar streak diário
    PERFORM update_daily_streak(NEW.id_usuario);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_update_user_progress ON game_sessions;
CREATE TRIGGER trigger_update_user_progress
    AFTER INSERT ON game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_progress();

-- 10. Dados iniciais para teste (corrigido)
INSERT INTO user_streaks (id_usuario, streak_type, current_count, max_count)
SELECT id, 'daily_play', 0, 0 FROM usuarios
ON CONFLICT (id_usuario, streak_type) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE game_sessions IS 'Sessões de jogo com métricas detalhadas';
COMMENT ON TABLE game_events IS 'Eventos granulares durante o jogo';
COMMENT ON TABLE user_discipline_progress IS 'Progresso do usuário por disciplina';
COMMENT ON TABLE user_badges IS 'Sistema de badges/conquistas';
COMMENT ON TABLE user_streaks IS 'Sistema de streaks/sequências';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Schema de analytics criado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: game_sessions, game_events, user_discipline_progress, user_badges, user_streaks';
    RAISE NOTICE '🔍 Views criadas: v_user_analytics, v_game_popularity';
    RAISE NOTICE '⚡ Triggers e funções configurados';
END $$;