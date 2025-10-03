// Adição ao jogoController.js - ENDPOINT OTIMIZADO

// READ ALL WITH RELATIONS - Endpoint otimizado que retorna jogos com disciplinas e anos
export const getAllJogosWithRelations = async (req, res, next) => {
    const { disciplinaId, anoId, usuarioId } = req.query;
    const { id: authenticatedUserId, id_papel, id_ano: userAno } = req.user;
    
    try {
        // Query otimizada com JOINs para buscar tudo de uma vez
        let baseQuery = `
            SELECT DISTINCT
                j.id,
                j.nome,
                j.descricao,
                j.url_jogo,
                j.url_thumbnail,
                j.created_at,
                j.updated_at,
                -- Agregação das disciplinas
                COALESCE(
                    JSON_AGG(
                        DISTINCT jsonb_build_object(
                            'id', d.id,
                            'nome', d.nome
                        )
                    ) FILTER (WHERE d.id IS NOT NULL), '[]'
                ) as disciplinas,
                -- Agregação dos anos
                COALESCE(
                    JSON_AGG(
                        DISTINCT jsonb_build_object(
                            'id', a.id,
                            'nome', a.nome
                        )
                    ) FILTER (WHERE a.id IS NOT NULL), '[]'
                ) as anos
            FROM jogos j
            LEFT JOIN jogos_disciplinas jd ON j.id = jd.id_jogo
            LEFT JOIN disciplinas d ON jd.id_disciplina = d.id
            LEFT JOIN jogos_anos ja ON j.id = ja.id_jogo
            LEFT JOIN anos a ON ja.id_ano = a.id
        `;
        
        const params = [];
        const conditions = [];
        
        // Filtro por disciplina
        if (disciplinaId) {
            conditions.push(`d.id = $${params.push(disciplinaId)}`);
        }
        
        // Filtro por ano
        if (anoId) {
            conditions.push(`a.id = $${params.push(anoId)}`);
        }
        
        // REGRA DE NEGÓCIO: Alunos só veem jogos do seu ano
        if (id_papel === 2 && userAno) { // 2 = papel de aluno
            conditions.push(`(a.id = $${params.push(userAno)} OR a.id IS NULL)`);
        }
        
        // Aplicar condições WHERE
        if (conditions.length > 0) {
            baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        baseQuery += `
            GROUP BY j.id, j.nome, j.descricao, j.url_jogo, j.url_thumbnail, j.created_at, j.updated_at
            ORDER BY j.nome ASC
        `;
        
        console.log('[DB] Executando query otimizada:', baseQuery);
        console.log('[DB] Parâmetros:', params);
        
        const { rows } = await db.query(baseQuery, params);
        
        // Log para debugging
        console.log(`[DB] Encontrados ${rows.length} jogos com relações`);
        if (rows.length > 0) {
            console.log('[DB] Exemplo:', {
                nome: rows[0].nome,
                disciplinas: rows[0].disciplinas?.length || 0,
                anos: rows[0].anos?.length || 0
            });
        }
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('[DB] Erro ao buscar jogos com relações:', error);
        next(error);
    }
};