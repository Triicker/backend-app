-- =====================================================
-- TABELA SIMPLES DE ANALYTICS PARA JOGOS
-- =====================================================

-- Tabela para capturar dados básicos quando um jogo é jogado
CREATE TABLE IF NOT EXISTS game_plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_jogo UUID NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
    pontuacao INTEGER,
    tempo_jogado INTEGER, -- em segundos
    completou BOOLEAN DEFAULT FALSE,
    data_jogada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dados_extras JSONB -- para armazenar dados flexíveis como difficulty, questions_answered, etc.
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_game_plays_usuario ON game_plays(id_usuario);
CREATE INDEX IF NOT EXISTS idx_game_plays_jogo ON game_plays(id_jogo);
CREATE INDEX IF NOT EXISTS idx_game_plays_data ON game_plays(data_jogada);

-- View para analytics com dados combinados (pontuacoes existentes + game_plays novas)
CREATE OR REPLACE VIEW v_analytics_combined AS
SELECT 
    id_usuario,
    id_jogo,
    pontuacao,
    data_registro as data_jogada,
    NULL as tempo_jogado,
    NULL as completou,
    'pontuacoes' as fonte
FROM pontuacoes
UNION ALL
SELECT 
    id_usuario,
    id_jogo,
    pontuacao,
    data_jogada,
    tempo_jogado,
    completou,
    'game_plays' as fonte
FROM game_plays;

-- Função para salvar uma jogada
CREATE OR REPLACE FUNCTION save_game_play(
    p_id_usuario UUID,
    p_id_jogo UUID,
    p_pontuacao INTEGER DEFAULT NULL,
    p_tempo_jogado INTEGER DEFAULT NULL,
    p_completou BOOLEAN DEFAULT FALSE,
    p_dados_extras JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    play_id UUID;
BEGIN
    INSERT INTO game_plays (
        id_usuario, 
        id_jogo, 
        pontuacao, 
        tempo_jogado, 
        completou, 
        dados_extras
    ) VALUES (
        p_id_usuario, 
        p_id_jogo, 
        p_pontuacao, 
        p_tempo_jogado, 
        p_completou, 
        p_dados_extras
    ) RETURNING id INTO play_id;
    
    RETURN play_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE game_plays IS 'Tabela para capturar dados de analytics dos jogos em tempo real';
COMMENT ON FUNCTION save_game_play IS 'Função para salvar dados de uma jogada com parâmetros flexíveis';