import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';




const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('')
  const [validPassword, setValidPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('')
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

    if (password.trim() === "") {
      toast.error("Password não inserida");
      return;
    }

    if (passwordConfirmation.trim() === "") {
      toast.error("Confirmação de Password não inserida");
      return;
    }

    if (!validPassword || !validPasswordConfirmation) {
      toast.error("Dados inválidos");
      return;
    }

    const resetPromise = api.put(`/users/reset-password/${token}`, { password });

    toast.promise(resetPromise, {
      pending: 'A atualizar palavra-passe...',
      success: 'Palavra-passe atualizada com sucesso!',
      error: 'Erro ao redefinir palavra-passe. O link pode ter expirado.',
    });

    try {
      await resetPromise;
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {

    }
  };



  return (
    <>
      <div id='containerLogin'>
        <div id='imageDiv'>
          <img src="/src/images/LOG.png" alt="LOG Logo" />
        </div>
        <main id='form'>
          <CssVarsProvider >
            <CssBaseline />
            <Sheet
              sx={{
                width: 400,
                mx: 'auto',
                my: 4,
                py: 3,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                borderRadius: 'sm',
                boxShadow: 'md',
              }}
              variant="outlined"
            >
              <div>
                <Typography level="h4" component="h1">
                  <b>LOG</b>
                </Typography>
                <Typography level="body-sm">Insira a nova senha.</Typography>
              </div>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={password}
                  required
                  onChange={e => setPassword(e.target.value)}
                />
              </FormControl>
              <p style={{ color: "red", fontSize: "12px" }}>{passwordError}</p>
              <FormControl>
                <FormLabel>Confirmação de Password</FormLabel>
                <Input
                  name="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  required
                  onChange={e => setPasswordConfirmation(e.target.value)}
                />
              </FormControl>
              <p style={{ color: "red", fontSize: "12px" }}>{passwordConfirmationError}</p>
              <Button sx={{ mt: 1 /* margin top */ }} onClick={handleSubmit}>Guardar</Button>
            </Sheet>
          </CssVarsProvider>
        </main>
      </div>
    </>
  );
}

export default ResetPassword;