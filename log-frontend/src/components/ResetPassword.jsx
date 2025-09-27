import { useParams, useNavigate } from 'react-router-dom';
import { use, useState, useEffect } from 'react';
import api from '../services/api'

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('')
  const [validPassword, setValidPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('')
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validPasswordConfirmation, setValidPasswordConfirmation] = useState('')
  const [counter, setCounter] = useState('')


  useEffect(() => {
            if (counter == 1) {
                let checkPassword = /^(?=.*[a-z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{6,100}$/;
                if (checkPassword.test(password) == false) {
                    setPasswordError("The password must be at least 6 characters and must contain letters, numbers and a character that is neither a letter nor a number")
                    setValidPassword(false)
                }
                else {
                    setPasswordError("");
                    setValidPassword(true)
                }
                if (password != passwordConfirmation) {
                    setPasswordConfirmationError("The password's doens't match")
                    setValidPasswordConfirmation(false)
                }
                else {
                    setPasswordConfirmationError("");
                    setValidPasswordConfirmation(true)
                }
            }
            else {
                setCounter(1)
            }
        }, [password, passwordConfirmation])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    
if (validPassword){
    try {
      await api.put(`/users/reset-password/${token}`, { password });
      setMessage('Palavra-passe atualizada com sucesso!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError('Erro ao redefinir palavra-passe. O link pode ter expirado.');
    }}
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Redefinir Palavra-Passe</h2>
      <form onSubmit={handleSubmit}>
        <label>Nova palavra-passe:</label><br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
        <p style={{color:"red"}}>{passwordError}</p>
        <br /><br />
        <label>Confirmar palavra-passe:</label><br />
        <input
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
        <p style={{color:"red"}}>{passwordConfirmationError}</p>
        <br /><br />
        <button type="submit">Atualizar</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ResetPassword;