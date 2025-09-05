// hash-password.js
import bcrypt from 'bcrypt';

const password = 'senha123'; // A senha que você quer usar
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar o hash:', err);
    return;
  }
  console.log('Senha original:', password);
  console.log('---');
  console.log('Hash gerado (copie este valor completo):');
  console.log(hash);
});
