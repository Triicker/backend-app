import db from '../db/index.js';

// ASSIGN CONQUISTA
export const assignConquista = async (req, res, next) => {
    const { id_usuario, id_conquista } = req.body;
    if (!id_usuario || !id_conquista) {
        return res.status(400).json({ error: 'id_usuario e id_conquista são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO usuarios_conquistas (id_usuario, id_conquista) VALUES ($1, $2) RETURNING *',
            [id_usuario, id_conquista]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { // foreign_key_violation
            return res.status(404).json({ error: 'Usuário ou conquista não encontrado(a).' });
        }
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Este usuário já possui esta conquista.' });
        }
        next(error);
    }
};

// GET CONQUISTAS BY USUARIO
export const getConquistasByUsuario = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.id, c.nome, c.descricao, c.icone_url, uc.data_obtencao
            FROM usuarios_conquistas uc
            JOIN conquistas c ON uc.id_conquista = c.id
            WHERE uc.id_usuario = $1
            ORDER BY uc.data_obtencao DESC;
        `;
        const { rows } = await db.query(query, [id]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// REMOVE CONQUISTA
export const removeConquista = async (req, res, next) => {
    const { id_usuario, id_conquista } = req.params;
    try {
        const { rowCount } = await db.query(
            'DELETE FROM usuarios_conquistas WHERE id_usuario = $1 AND id_conquista = $2',
            [id_usuario, id_conquista]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Associação de conquista não encontrada para deletar.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};