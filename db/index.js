import pg from 'pg';
import 'dotenv/config';

// A documentação do 'pg' (node-postgres) recomenda usar Pool
// para gerenciar conexões com o banco de dados.
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Se a DATABASE_URL estiver definida (apontando para um banco remoto como o do Render),
// é necessário habilitar o SSL para conexões externas.
if (poolConfig.connectionString) {
  poolConfig.ssl = {
    rejectUnauthorized: false // Necessário para bancos de dados do Render/Heroku
  };
}

const pool = new pg.Pool(poolConfig);

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
    try {
        await pool.query('SELECT NOW()'); // Query simples para testar a conexão
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
    }
};

export default {
  query: (text, params) => pool.query(text, params),
  testConnection, // Exporta a função de teste
  getPool: () => pool // Exporta o pool para casos de uso avançados (transações, etc.)
};