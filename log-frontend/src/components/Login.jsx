import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';




export default function Login() {
    const [error, setError] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const navigate = useNavigate();
    const [logoutMessage, setLogoutMessage] = useState('');
    const { updateUser } = useAuth();

    useEffect(() => {
        const reason = localStorage.getItem('logoutReason');
        if (reason) {
            setLogoutMessage(reason);
            toast.error(reason);
            localStorage.removeItem('logoutReason');
        }
    }, []);


    async function handleSubmit(e) {
        e.preventDefault();
        if (emailInput.trim == ""){
            toast.error("Email não inserido")
        }
        if (passwordInput.trim == ""){
            toast.error("Password não inserida")
        }

        try {
            const response = await api.post('/users/login', { email: emailInput, password: passwordInput });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            updateUser(user);
            navigate('/home');

        } catch (error) {
            console.log(error)

            if (error.response?.status === 401) {
                toast.error('Password incorreta');
            }

            if (error.response?.status === 404 ) {
                toast.info('Utilizador não encontrado. Por favor registe-se.');
            }

            if (error.response?.status === 403 ) {
                toast.info('O seu registo aguarda aprovação. Contacte o administrador..');
            }
            setEmailInput("");
            setPasswordInput("")
        }
    }

    return (
        <>
            <div id='containerLogin'>
                <div id='imageDiv'>
                    <img src="./images/LOG.png" alt="LOG Logo" />
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
                                <Typography level="body-sm">Insira os seus dados de autenticação.</Typography>
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
                            <FormControl>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    name="password"
                                    type="password"
                                    value={passwordInput}
                                    required
                                    onChange={e => setPasswordInput(e.target.value)}
                                />
                            </FormControl>
                            <Button sx={{ mt: 1 /* margin top */ }} onClick={handleSubmit}>Entrar</Button>
                            <Typography
                                endDecorator={<Link to="/ForgotPassword">Recuperar</Link>}
                                sx={{ fontSize: 'sm', alignSelf: 'center' }}
                            >
                                Esqueceu a Password?
                            </Typography>
                            <Typography
                                endDecorator={<Link to="/SignUp">Registar</Link>}
                                sx={{ fontSize: 'sm', alignSelf: 'center' }}
                            >
                                Não tem conta?
                            </Typography>
                        </Sheet>
                    </CssVarsProvider>
                </main>
            </div>
        </>
    );
}