import db from '../db/index.js';

// Função auxiliar para lidar com transações
const runInTransaction = async (callback) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// CREATE
export const createVideo = async (req, res, next) => {
    const { nome, descricao, url_video, url_thumbnail, duracao_segundos, disciplinaIds, anoIds } = req.body;
    if (!nome || !url_video) {
        return res.status(400).json({ error: 'Os campos "nome" e "url_video" são obrigatórios.' });
    }

    try {
        const video = await runInTransaction(async (client) => {
            const videoResult = await client.query(
                'INSERT INTO videos (nome, descricao, url_video, url_thumbnail, duracao_segundos) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [nome, descricao, url_video, url_thumbnail, duracao_segundos]
            );
            const newVideo = videoResult.rows[0];

            if (disciplinaIds && disciplinaIds.length > 0) {
                for (const id_disciplina of disciplinaIds) {
                    await client.query('INSERT INTO videos_disciplinas (id_video, id_disciplina) VALUES ($1, $2)', [newVideo.id, id_disciplina]);
                }
            }

            if (anoIds && anoIds.length > 0) {
                for (const id_ano of anoIds) {
                    await client.query('INSERT INTO videos_anos (id_video, id_ano) VALUES ($1, $2)', [newVideo.id, id_ano]);
                }
            }
            return newVideo;
        });
        res.status(201).json(video);
    } catch (error) {
        next(error);
    }
};

// READ ALL (com filtros)
export const getAllVideos = async (req, res, next) => {
    const { disciplinaId, anoId } = req.query;
    try {
        let query = 'SELECT DISTINCT v.* FROM videos v';
        const params = [];
        let paramIndex = 1;

        if (disciplinaId) {
            query += ` JOIN videos_disciplinas vd ON v.id = vd.id_video WHERE vd.id_disciplina = $${paramIndex++}`;
            params.push(disciplinaId);
        }

        if (anoId) {
            query += disciplinaId ? ' AND' : ' WHERE';
            query += ` v.id IN (SELECT id_video FROM videos_anos WHERE id_ano = $${paramIndex++})`;
            params.push(anoId);
        }

        query += ' ORDER BY v.nome ASC';
        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// READ ONE
export const getVideoById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const videoResult = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
        if (videoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Vídeo não encontrado.' });
        }
        const video = videoResult.rows[0];

        const disciplinasResult = await db.query('SELECT id_disciplina FROM videos_disciplinas WHERE id_video = $1', [id]);
        video.disciplinaIds = disciplinasResult.rows.map(r => r.id_disciplina);

        const anosResult = await db.query('SELECT id_ano FROM videos_anos WHERE id_video = $1', [id]);
        video.anoIds = anosResult.rows.map(r => r.id_ano);

        res.status(200).json(video);
    } catch (error) {
        next(error);
    }
};

// UPDATE
export const updateVideo = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, url_video, url_thumbnail, duracao_segundos, disciplinaIds, anoIds } = req.body;

    try {
        const video = await runInTransaction(async (client) => {
            const videoResult = await client.query(
                'UPDATE videos SET nome = $1, descricao = $2, url_video = $3, url_thumbnail = $4, duracao_segundos = $5 WHERE id = $6 RETURNING *',
                [nome, descricao, url_video, url_thumbnail, duracao_segundos, id]
            );
            if (videoResult.rowCount === 0) {
                throw { statusCode: 404, message: 'Vídeo não encontrado para atualizar.' };
            }
            const updatedVideo = videoResult.rows[0];

            // Atualiza associações (deletando as antigas e inserindo as novas)
            await client.query('DELETE FROM videos_disciplinas WHERE id_video = $1', [id]);
            if (disciplinaIds && disciplinaIds.length > 0) {
                for (const id_disciplina of disciplinaIds) {
                    await client.query('INSERT INTO videos_disciplinas (id_video, id_disciplina) VALUES ($1, $2)', [id, id_disciplina]);
                }
            }

            await client.query('DELETE FROM videos_anos WHERE id_video = $1', [id]);
            if (anoIds && anoIds.length > 0) {
                for (const id_ano of anoIds) {
                    await client.query('INSERT INTO videos_anos (id_video, id_ano) VALUES ($1, $2)', [id, id_ano]);
                }
            }
            return updatedVideo;
        });
        res.status(200).json(video);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
};

// DELETE
export const deleteVideo = async (req, res, next) => {
    const { id } = req.params;
    try {
        // A deleção em cascata (ON DELETE CASCADE) nas tabelas de associação cuidará das referências.
        const { rowCount } = await db.query('DELETE FROM videos WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Vídeo não encontrado para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};