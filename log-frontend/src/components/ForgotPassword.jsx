import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import api from '../services/api'
import { toast } from 'react-toastify';

export default function Login() {
    const [emailInput, setEmailInput] = useState("");
    const navigate = useNavigate();


const handleSubmit = async (e) => {
  e.preventDefault();

  if (emailInput.trim() === "") {
    toast.error("Email não inserido");
    return;
  }

    try {
    await toast.promise(
      api.post('/users/forgot-password', { email: emailInput }),
      {
        pending: 'A enviar email...',
        success: 'Email enviado com sucesso!',
        error: 'Erro ao enviar email.',
      }
    );

    navigate('/');

  } catch (err) {
  }
};








     function closePage() {
        navigate("/")
    }

    return (
        <>
            <div id='containerLogin'>
                <div id='imageDiv'>
                    <img src="/images/LOG.png" alt="LOG Logo" />
                </div>
                <main id='form'>
                    <CssVarsProvider >
                        <CssBaseline />
                        <Sheet
                            sx={{
                                width: 400,
                                mx: 'auto', // margin left & right
                                my: 4, // margin top & bottom
                                py: 3, // padding top & bottom
                                px: 2, // padding left & right
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
                                <Typography level="body-sm">Recuperar password, insira o seu email.</Typography>
                            </div>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    name="email"
                                    type="email"
                                    value={emailInput}
                                    required
                                    onChange={e => setEmailInput(e.target.value.toLowerCase())}
                                />
                            </FormControl>
                            <Button sx={{ mt: 1 /* margin top */ }} onClick={handleSubmit}>Enviar</Button>
                            <Button sx={{ mt: 1 /* margin top */ }} onClick={closePage}>Voltar</Button>
                            
                            
                        </Sheet>
                    </CssVarsProvider>
                </main>
            </div>
        </>
    );
}