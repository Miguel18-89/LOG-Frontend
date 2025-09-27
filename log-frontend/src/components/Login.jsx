import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { Link, useNavigate } from 'react-router-dom';
import React, {useState, useEffect } from "react";
import api from '../services/api'


export default function Login() {
    const [error, setError] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const navigate = useNavigate();
    const [logoutMessage, setLogoutMessage] = useState('');

    useEffect(() => {
        const reason = localStorage.getItem('logoutReason');
        if (reason) {
            setLogoutMessage(reason);
            alert(reason);
            localStorage.removeItem('logoutReason');
        }
    }, []);




    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError("");

            await api.post('/users/login', {
                email: emailInput,
                password: passwordInput
            }).then(response => {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setEmailInput("")
                setPasswordInput("")
                navigate("/Home")
            })
        } catch (error) {
            alert(JSON.stringify(error.response?.data));
            setEmailInput("");
            setPasswordInput("")
        }
    }

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