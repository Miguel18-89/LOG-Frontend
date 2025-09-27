import { useState } from 'react';
import api from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/users/forgot-password', { email });
      setMessage('Email enviado com sucesso! Verifica a tua caixa de entrada.');
    } catch (err) {
      setError('Erro ao enviar email. Verifica se o endereço está correto.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Recuperar Palavra-Passe</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label><br />
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        /><br /><br />
        <button type="submit" style={{ padding: '10px 20px' }}>Send</button>
      </form>

      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;