import pg from 'pg';

// Este arquivo assume que você está usando a biblioteca 'pg' (node-postgres)

const { Pool } = pg;

// A Render.com define a variável de ambiente DATABASE_URL automaticamente
// para o seu serviço de banco de dados PostgreSQL.
// Para desenvolvimento local, você pode definir essa variável em seu arquivo .env
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  // Em produção (na Render), é recomendado/necessário usar SSL.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default {
  query: (text, params) => pool.query(text, params),
};