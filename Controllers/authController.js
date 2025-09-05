import db from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginUser = async (req, res, next) => {
    const { username, senha } = req.body;

    if (!username || !senha) {
        return res.status(400).json({ error: 'Username e senha são obrigatórios.' });
    }

    try {
        const { rows } = await db.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        const user = rows[0];

        // Mensagem de erro genérica para não revelar se um usuário existe ou não
        // Verifica se o usuário existe e se a sua atividade é 1 (ativo)
        if (!user || user.atividade !== 1) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Compara a senha enviada com o hash salvo no banco
        const passwordMatches = await bcrypt.compare(senha, user.senha);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Se as credenciais estiverem corretas, cria o payload do token
        const payload = {
            id: user.id,
            username: user.username,
            role: user.id_papel
        };

        // Assina o token com o segredo do .env
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // O token expira em 1 dia
        );

        // Remove a senha do objeto de usuário antes de enviar a resposta
        delete user.senha;

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            user: user
        });
    } catch (error) {
        next(error); // Passa o erro para o middleware de tratamento de erros
    }
};