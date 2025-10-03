// Teste simples do analytics
import db from './db/index.js';

console.log('🧪 Testando Analytics...');

try {
    // Testa query básica do dashboard
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
    
    console.log('✅ Dashboard Overview:');
    console.log(overview.rows[0]);
    
    // Testa query de popularidade
    const popularity = await db.query(`
        SELECT 
            j.nome as game_name,
            j.id as game_id,
            COUNT(p.id) as total_plays,
            COUNT(DISTINCT p.id_usuario) as unique_players,
            ROUND(AVG(p.pontuacao), 2) as average_score,
            MAX(p.pontuacao) as best_score
        FROM jogos j
        LEFT JOIN pontuacoes p ON j.id::text = p.id_jogo::text
        LEFT JOIN disciplinas d ON j.id_disciplina::text = d.id::text
        GROUP BY j.id, j.nome, d.nome
        HAVING COUNT(p.id) > 0
        ORDER BY total_plays DESC, average_score DESC
        LIMIT 5
    `);
    
    console.log('\n✅ Top 5 Jogos Populares:');
    popularity.rows.forEach((game, i) => {
        console.log(`${i+1}. ${game.game_name} - ${game.total_plays} jogadas, nota média: ${game.average_score}`);
    });
    
    console.log('\n🎉 Analytics funcionando perfeitamente!');
    
} catch (error) {
    console.error('❌ Erro no teste:', error.message);
} finally {
    process.exit(0);
}