import { useEffect, useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import Navbar from './Navbar';
import api from '../services/api';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Checkbox from '@mui/joy/Checkbox';
import { toast } from 'react-toastify';
import { showConfirmationToast } from '../utils/showConfirmationToast';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';

const roleLabels = {
    0: 'Instalador',
    1: 'Gestor de Projecto',
    2: 'Administrador',
};

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUsers, setEditedUsers] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users', {
                    params: {
                        page,
                        pageSize,
                        search: searchTerm || undefined,
                    }
                });
                setUsers(response.data.allUsers);
            } catch (error) {
                console.error('Erro ao buscar utilizadores:', error);
            }
        };
        fetchUsers();
    }, [page, pageSize, searchTerm]);

    const handleEdit = (id) => {
        setEditingUserId(id);
        const user = users.find((u) => u.id === id);
        setEditedUsers((prev) => ({
            ...prev,
            [id]: { ...user },
        }));
    };

    const handleChange = (id, field, value) => {
        setEditedUsers((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
            },
        }));
    };

    const handleSave = async (id) => {
        try {
            const updated = editedUsers[id];
            await api.put(`/users/${id}`, updated);
            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
            );
        } catch (error) {
            console.error('Erro ao guardar utilizador:', error);

            if (error.response?.status === 403) {
                toast.info('Não é possível alterar o role ou aprovação porque este é o único administrador ativo.');
            } else {
                toast.error('Erro ao guardar utilizador. Tente novamente.');
            }
        } finally {
            setEditingUserId(null);
        }
    };


    const handleDelete = async (id) => {
        showConfirmationToast({
            message: 'Tem a certeza que deseja apagar este utilizador?',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    toast.success("Utilizador apagado com sucesso")
                    setUsers((prev) => prev.filter((u) => u.id !== id));
                } catch (error) {
                    console.error('Erro ao apagar utilizador:', error);
                    toast.info('Não foi possível apagar o utilizador. Verifique se é o único administrador.');
                }
            }
        })
    };

    return (
        <>
            <Navbar />
            <CssVarsProvider>
                <main style={{ padding: '1.5rem' }}>
                    <Sheet
                        sx={{
                            maxWidth: 1000,
                            mx: 'auto',
                            p: 3,
                            borderRadius: 'sm',
                            boxShadow: 'lg',
                            backgroundColor: '#fff',
                        }}
                        variant="outlined"
                    >
                        <Typography
                            level="h4"
                            sx={{
                                mb: 2,
                                fontWeight: 'bold',
                                color: '#f57c00',
                                textAlign: 'center',
                            }}
                        >
                            Lista de Utilizadores
                        </Typography>
                        <FormControl size="sm" sx={{ mb: 2 }}>
                            <FormLabel>Pesquisar utilizador</FormLabel>
                            <Input
                                placeholder="Nome ou email"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                variant="soft"
                            />
                        </FormControl>
                        <Table borderAxis="xBetween" size="sm" stripe="odd">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th style={{ textAlign: 'center' }}>Email</th>
                                    <th style={{ textAlign: 'center' }}>Role</th>
                                    <th style={{ textAlign: 'center' }}>Aprovado</th>
                                    <th style={{ textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(users) &&
                                    users.map((user) => {
                                        const isEditing = editingUserId === user.id;
                                        const data = isEditing ? editedUsers[user.id] : user;

                                        return (
                                            <tr key={user.id}>
                                                <td>{data.name}</td>
                                                <td style={{ textAlign: 'center' }}>{data.email}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {isEditing ? (
                                                        <Select
                                                            size="sm"
                                                            value={data.role}
                                                            onChange={(e, val) =>
                                                                handleChange(user.id, 'role', val)
                                                            }
                                                        >
                                                            <Option value={0}>Instalador</Option>
                                                            <Option value={1}>Gestor de Projecto</Option>
                                                            <Option value={2}>Administrador</Option>
                                                        </Select>
                                                    ) : (
                                                        roleLabels[data.role] ?? 'Desconhecido'
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {isEditing ? (
                                                        <Checkbox
                                                            checked={data.approved}
                                                            onChange={(e) =>
                                                                handleChange(user.id, 'approved', e.target.checked)
                                                            }
                                                            size="sm"
                                                            variant="outlined"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <Checkbox checked={data.approved} disabled size="sm" />
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                        {isEditing ? (
                                                            <>
                                                                <Tooltip title="Guardar" placement="top">
                                                                    <IconButton
                                                                        size="sm"
                                                                        variant="plain"
                                                                        onClick={() => handleSave(user.id)}
                                                                    >
                                                                        <SaveIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Tooltip title="Editar" placement="top">
                                                                    <IconButton
                                                                        size="sm"
                                                                        variant="plain"
                                                                        onClick={() => handleEdit(user.id)}
                                                                    >
                                                                        <EditIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Apagar" placement="top">
                                                                    <IconButton
                                                                        size="sm"
                                                                        variant="plain"
                                                                        onClick={() => handleDelete(user.id)}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </Box>
                                                </td>

                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </Table>
                        <br />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <Typography level="body-sm" sx={{ mr: 1 }}>
                                    Resultados por página:
                                </Typography>
                                <Select
                                    value={pageSize}
                                    onChange={(_, value) => {
                                        setPageSize(Number(value));
                                        setPage(1);
                                    }}
                                    size="sm"
                                >
                                    {[10, 15, 20, 25].map((size) => (
                                        <Option key={size} value={size}>
                                            {size}
                                        </Option>
                                    ))}
                                </Select>
                            </Box>
                            <Button
                                disabled={page === 1}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                Anterior
                            </Button>
                            <Typography level="body-md">Página {page} de {Math.ceil(total / pageSize) || 1}</Typography>
                            <Button
                                disabled={page * pageSize >= total}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Seguinte
                            </Button>
                        </Box>
                    </Sheet>
                </main>
            </CssVarsProvider>
        </>
    );
}