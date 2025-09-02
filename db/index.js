import pg from 'pg';
import 'dotenv/config';

// A documentação do 'pg' (node-postgres) recomenda usar Pool
// para gerenciar conexões com o banco de dados.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Adicionado para conexões com serviços como Render, Heroku, etc.
  // que exigem SSL.
  ssl: {
    rejectUnauthorized: false
  }
});

// Opcional: Adiciona um listener para testar a conexão ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao banco de dados:', err.stack);
  }
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
  client.release(); // Libera o cliente de volta para o pool
});


export default {
  query: (text, params) => pool.query(text, params),
};