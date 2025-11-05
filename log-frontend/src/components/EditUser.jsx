import Navbar from './Navbar';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import { showConfirmationToast } from '../utils/showConfirmationToast';

export default function EditUser() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [validName, setValidName] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.name) {
            setName(user.name);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim().length < 2) {
            setNameError('O nome deve conter no mínimo 2 letras.');
            setValidName(false);
            return;
        }

        try {
            const updatedUser = { name };
            await api.put(`/users/${user.id}`, updatedUser);

            const newUser = { ...user, name };
            updateUser(newUser);

            toast.success('Perfil atualizado com sucesso.');
            navigate('/Home');
        } catch (err) {
            console.error('Erro ao atualizar utilizador:', err);
            toast.error('Erro ao atualizar perfil.');
        }
    };

    const ResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            await toast.promise(
                api.post('/users/forgot-password', {
                    email: user.email,
                }),
                {
                    pending: 'A enviar email...',
                    success: 'Email enviado com sucesso! Verifica a tua caixa de entrada.',
                    error: 'Erro ao enviar email.',
                }
            );
        } catch (error) {
            console.error("Erro ao enviar pedido de redefinição:", error);
        }
    };



    const deleteUser = async () => {
        showConfirmationToast({
            message: 'Tem a certeza que deseja apagar a sua conta?',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${user.id}`);
                    toast.success("utilizador apagado com sucesso")
                    navigate("/")
                } catch (error) {
                    console.error('Erro ao apagar utilizador:', error);
                    toast.error('Não foi possível apagar o utilizador. Verifique se é o único administrador.');
                }
            },
        });
    };

    return (
        <>
            <Navbar />
            <div>
                <main style={{ padding: '1.5rem' }}>
                    <CssVarsProvider>
                        <Sheet
                            sx={{
                                maxWidth: 1000,
                                mx: 'auto',
                                py: 3,
                                px: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                borderRadius: 'sm',
                                boxShadow: 'lg',
                                backgroundColor: '#fff',
                            }}
                            variant="outlined"
                        >
                            <Typography sx={{ fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }} level="h4" component="h1">
                                <p style={{ margin: 0 }}>Meu perfil</p>
                            </Typography>

                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input name="email" type="email" value={user?.email || ''} disabled />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Nome</FormLabel>
                                <Input
                                    name="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setValidName(true);
                                        setNameError('');
                                    }}
                                />
                                {nameError && <p style={{ color: 'red', fontSize: '12px' }}>{nameError}</p>}
                            </FormControl>

                            <Button sx={{ mt: 1 }} onClick={handleSubmit}>
                                Atualizar perfil
                            </Button>


                            <Button sx={{ mt: 1 }} onClick={ResetPassword}>
                                Alterar password
                            </Button>

                            <Button sx={{ mt: 1 }} onClick={deleteUser}>
                                Apagar conta
                            </Button>

                            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        </Sheet>
                    </CssVarsProvider>
                </main>
            </div>
        </>
    );
}