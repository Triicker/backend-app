import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// A biblioteca 'pg' usará automaticamente as variáveis de ambiente PGUSER, PGHOST, PGDATABASE, PGPASSWORD, e PGPORT
const pool = new Pool();

pool.connect((err) => {
    if (err) {
        console.error('❌ Falha ao conectar com o banco de dados PostgreSQL', err.stack);
    } else {
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    }
});

// Exportamos um objeto com um método query para que o resto da aplicação possa usá-lo
export default {
    query: (text, params) => pool.query(text, params),
};