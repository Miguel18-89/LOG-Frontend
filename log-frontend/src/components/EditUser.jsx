import Navbar from './Navbar';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Box from '@mui/joy/Box';
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

    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinExists, setPinExists] = useState(false);

    async function sha256Hex(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    useEffect(() => {
        if (user?.name) setName(user.name);
        if (user?.id) {
            api.get(`/users/${user.id}`).then(res => {
                setPinExists(!!res.data.pinExists);
            }).catch(() => {});
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            setNameError('O nome deve conter no mínimo 2 letras.');
            return;
        }
        try {
            await api.put(`/users/${user.id}`, { name });
            updateUser({ ...user, name });
            toast.success('Perfil atualizado com sucesso.');
            navigate('/Home');
        } catch {
            toast.error('Erro ao atualizar perfil.');
        }
    };

    const handleSavePin = async () => {
        if (!pin.trim()) {
            toast.error('Introduza um PIN.');
            return;
        }
        if (!/^\d{4,8}$/.test(pin)) {
            toast.error('O PIN deve ser numérico e ter entre 4 a 8 dígitos.');
            return;
        }
        if (pin !== pinConfirm) {
            toast.error('Os PINs não coincidem.');
            return;
        }
        setPinLoading(true);
        try {
            const pinHash = await sha256Hex(pin);
            await api.put(`/users/${user.id}`, { pin: pinHash });
            setPin('');
            setPinConfirm('');
            setPinExists(true);
            toast.success('PIN guardado com sucesso.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar o PIN.');
        } finally {
            setPinLoading(false);
        }
    };

    const handleRemovePin = async () => {
        showConfirmationToast({
            message: 'Tem a certeza que deseja remover o PIN?',
            onConfirm: async () => {
                try {
                    await api.put(`/users/${user.id}`, { pin: null });
                    setPin('');
                    setPinConfirm('');
                    setPinExists(false);
                    toast.success('PIN removido.');
                } catch {
                    toast.error('Erro ao remover o PIN.');
                }
            },
        });
    };

    const ResetPassword = async (e) => {
        e.preventDefault();
        try {
            await toast.promise(
                api.post('/users/forgot-password', { email: user.email }),
                {
                    pending: 'A enviar email...',
                    success: 'Email enviado! Verifica a tua caixa de entrada.',
                    error: 'Erro ao enviar email.',
                }
            );
        } catch {
            // tratado pelo toast.promise
        }
    };

    const deleteUser = async () => {
        showConfirmationToast({
            message: 'Tem a certeza que deseja apagar a sua conta?',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${user.id}`);
                    toast.success('Conta apagada com sucesso.');
                    navigate('/');
                } catch {
                    toast.error('Não foi possível apagar o utilizador. Verifique se é o único administrador.');
                }
            },
        });
    };

    return (
        <>
            <Navbar />
            <CssVarsProvider>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Sheet
                        sx={{
                            maxWidth: 560,
                            width: '100%',
                            py: 3,
                            px: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            borderRadius: 'sm',
                            boxShadow: 'lg',
                            backgroundColor: '#ffffff',
                        }}
                        variant="outlined"
                    >
                        <Typography level="h4" sx={{ fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}>
                            Meu perfil
                        </Typography>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input type="email" value={user?.email || ''} disabled />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Nome</FormLabel>
                            <Input
                                type="text"
                                value={name}
                                onChange={e => { setName(e.target.value); setNameError(''); }}
                            />
                            {nameError && <Typography level="body-xs" sx={{ color: 'danger.500', mt: 0.5 }}>{nameError}</Typography>}
                        </FormControl>

                        <Button onClick={handleSubmit}>Atualizar perfil</Button>
                        <Button onClick={ResetPassword}>Alterar password</Button>

                        <Divider sx={{ my: 1 }} />

                        <Typography level="title-sm" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                            PIN de registo de horas
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#888', mt: -1 }}>
                            Este PIN é utilizado para registar horas extra sem necessidade de login.
                            {pinExists ? ' Já tem um PIN definido.' : ' Ainda não tem PIN definido.'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel>{pinExists ? 'Novo PIN' : 'PIN'}</FormLabel>
                                <Input
                                    type="password"
                                    placeholder="••••"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    slotProps={{ input: { inputMode: 'numeric', maxLength: 8 } }}
                                />
                            </FormControl>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel>Confirmar PIN</FormLabel>
                                <Input
                                    type="password"
                                    placeholder="••••"
                                    value={pinConfirm}
                                    onChange={e => setPinConfirm(e.target.value)}
                                    slotProps={{ input: { inputMode: 'numeric', maxLength: 8 } }}
                                />
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                color="warning"
                                loading={pinLoading}
                                onClick={handleSavePin}
                                sx={{ flex: 1 }}
                            >
                                {pinExists ? 'Alterar PIN' : 'Definir PIN'}
                            </Button>
                            {pinExists && (
                                <Button variant="outlined" color="danger" onClick={handleRemovePin}>
                                    Remover PIN
                                </Button>
                            )}
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Button color="danger" variant="outlined" onClick={deleteUser}>
                            Apagar conta
                        </Button>
                    </Sheet>
                </Box>
            </CssVarsProvider>
        </>
    );
}
