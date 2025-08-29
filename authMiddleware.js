import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        // Adiciona os dados do usuário decodificados ao objeto da requisição
        req.user = decoded;
        next();
    });
};
