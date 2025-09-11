import db from '../db/index.js';

// CREATE
export const createJogo = async (req, res, next) => {
    const { nome, descricao, url_jogo, url_thumbnail, disciplinaIds, anoIds } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Insere o jogo
        const jogoResult = await client.query(
            'INSERT INTO jogos (nome, descricao, url_jogo, url_thumbnail) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, descricao, url_jogo, url_thumbnail]
        );
        const novoJogo = jogoResult.rows[0];

        // 2. Insere as associações com disciplinas
        if (disciplinaIds && disciplinaIds.length > 0) {
            const disciplinaQuery = 'INSERT INTO jogos_disciplinas (id_jogo, id_disciplina) VALUES ' +
                disciplinaIds.map((_, i) => `($1, $${i + 2})`).join(',');
            await client.query(disciplinaQuery, [novoJogo.id, ...disciplinaIds]);
        }

        // 3. Insere as associações com anos
        if (anoIds && anoIds.length > 0) {
            const anoQuery = 'INSERT INTO jogos_anos (id_jogo, id_ano) VALUES ' +
                anoIds.map((_, i) => `($1, $${i + 2})`).join(',');
            await client.query(anoQuery, [novoJogo.id, ...anoIds]);
        }

        await client.query('COMMIT');
        res.status(201).json(novoJogo);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Já existe um jogo com este nome.' });
        }
        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({ error: 'Um dos IDs de disciplina ou ano fornecidos é inválido.' });
        }
        next(error);
    } finally {
        client.release();
    }
};

// NOVO - READ: Listar jogos para o aluno logado, filtrado por disciplina
export const getJogosParaAluno = async (req, res, next) => {
    const { disciplinaId } = req.query;
    const { id: id_usuario } = req.user; // ID do aluno logado

    if (!disciplinaId) {
        return res.status(400).json({ error: 'O "disciplinaId" é obrigatório como parâmetro de query.' });
    }

    try {
        // Busca todos os jogos que correspondem à disciplina fornecida,
        // sem aplicar filtros específicos do aluno, conforme solicitado.
        const query = `
            SELECT j.* 
            FROM jogos j
            JOIN jogos_disciplinas jd ON j.id = jd.id_jogo
            WHERE jd.id_disciplina = $1
            ORDER BY j.nome ASC;
        `;
        const { rows } = await db.query(query, [disciplinaId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ALL
export const getAllJogos = async (req, res, next) => {
    const { disciplinaId, anoId } = req.query;
    try {
        let query = 'SELECT DISTINCT j.* FROM jogos j';
        const params = [];
        let joinCount = 0;

        if (disciplinaId) {
            query += ` JOIN jogos_disciplinas jd ON j.id = jd.id_jogo AND jd.id_disciplina = $${params.push(disciplinaId)}`;
        }
        if (anoId) {
            query += ` JOIN jogos_anos ja ON j.id = ja.id_jogo AND ja.id_ano = $${params.push(anoId)}`;
        }

        query += ' ORDER BY j.nome ASC';

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getJogoById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const jogoQuery = 'SELECT * FROM jogos WHERE id = $1';
        const jogoResult = await db.query(jogoQuery, [id]);

        if (jogoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado.' });
        }
        const jogo = jogoResult.rows[0];

        // Busca as disciplinas e anos associados
        const disciplinasQuery = 'SELECT d.id, d.nome FROM disciplinas d JOIN jogos_disciplinas jd ON d.id = jd.id_disciplina WHERE jd.id_jogo = $1';
        const anosQuery = 'SELECT a.id, a.nome FROM anos a JOIN jogos_anos ja ON a.id = ja.id_ano WHERE ja.id_jogo = $1';

        const [disciplinasResult, anosResult] = await Promise.all([db.query(disciplinasQuery, [id]), db.query(anosQuery, [id])]);

        jogo.disciplinas = disciplinasResult.rows;
        jogo.anos = anosResult.rows;

        res.status(200).json(jogo);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateJogo = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, url_jogo, url_thumbnail, disciplinaIds, anoIds } = req.body;

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Atualiza os dados do jogo
        const jogoResult = await client.query(
            'UPDATE jogos SET nome = $1, descricao = $2, url_jogo = $3, url_thumbnail = $4 WHERE id = $5 RETURNING *',
            [nome, descricao, url_jogo, url_thumbnail, id]
        );
        if (jogoResult.rowCount === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado para atualizar.' });
        }

        // 2. Atualiza as associações (deleta as antigas e insere as novas)
        await client.query('DELETE FROM jogos_disciplinas WHERE id_jogo = $1', [id]);
        if (disciplinaIds && disciplinaIds.length > 0) {
            const disciplinaQuery = 'INSERT INTO jogos_disciplinas (id_jogo, id_disciplina) VALUES ' +
                disciplinaIds.map((_, i) => `($1, $${i + 2})`).join(',');
            await client.query(disciplinaQuery, [id, ...disciplinaIds]);
        }

        await client.query('DELETE FROM jogos_anos WHERE id_jogo = $1', [id]);
        if (anoIds && anoIds.length > 0) {
            const anoQuery = 'INSERT INTO jogos_anos (id_jogo, id_ano) VALUES ' +
                anoIds.map((_, i) => `($1, $${i + 2})`).join(',');
            await client.query(anoQuery, [id, ...anoIds]);
        }

        await client.query('COMMIT');
        res.status(200).json(jogoResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe um jogo com este nome.' });
        }
        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({ error: 'Um dos IDs de disciplina ou ano fornecidos é inválido.' });
        }
        next(error);
    } finally {
        client.release();
    }
};

// DELETE
export const deleteJogo = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM jogos WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Jogo não encontrado para deletar.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Não é possível deletar o jogo pois existem pontuações ou outras associações (disciplinas, anos) ligadas a ele.' });
        }
        next(error);
    }
};