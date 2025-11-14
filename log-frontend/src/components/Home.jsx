import { useEffect, useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import Navbar from './Navbar';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import '../styles/HomePage.css';

const statusColors = {
    partial: '#fbc02d',
    complete: '#388e3c',
};

const valueColors = {
    1: '#fbc02d',
    2: '#388e3c',
};

function StatusDot({ status, value }) {
    const backgroundColor =
        statusColors[status] ||
        valueColors[value] ||
        '#9e9e9e';

    return (
        <Box
            sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor,
                mx: 'auto',
            }}
        />
    );
}

function getStatus(array) {
    return Array.isArray(array) && array.length > 0 ? array[0].status : null;
}

export default function StoreList() {
    const [stores, setStores] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores', {
                params: {
                    page,
                    pageSize,
                    search: searchTerm || undefined,
                },
            });
            setStores(response.data.allStores);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Erro ao buscar lojas:', error);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [page, pageSize, searchTerm]);

    return (
        <>
            <Navbar />
            <CssVarsProvider>
                <main className="store-container">
                    <Sheet
                        sx={{
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
                            className="header-title"
                            sx={{
                                mb: 2,
                                fontWeight: 'bold',
                                color: '#f57c00',
                                textAlign: 'center',
                            }}
                        >
                            Lista de Lojas
                        </Typography>

                        <FormControl size="sm" sx={{ mb: 2 }}>
                            <FormLabel>Pesquisar loja</FormLabel>
                            <Input
                                placeholder="Nome ou número"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                variant="soft"
                            />
                        </FormControl>

                        {/* Wrapper responsivo */}
                        <div className="responsive-table-wrapper">
                            <Table borderAxis="xBetween" size="sm" stripe="odd">
                                <thead>
                                    <tr>
                                        <th style={{ width: '20%' }}>Nome</th>
                                        <th style={{ textAlign: 'center' }}>Número</th>
                                        <th style={{ textAlign: 'center' }}>Regional</th>
                                        <th style={{ textAlign: 'center' }}>Survey</th>
                                        <th style={{ textAlign: 'center' }}>Aprovisionamento</th>
                                        <th style={{ textAlign: 'center' }}>1ª Fase</th>
                                        <th style={{ textAlign: 'center' }}>2ª Fase</th>
                                        <th style={{ textAlign: 'center' }}>Abertura</th>
                                        <th style={{ textAlign: 'center' }}>Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(stores) &&
                                        stores.map((store) => (
                                            <tr key={store.id}>
                                                <td>{store.storeName}</td>
                                                <td style={{ textAlign: 'center' }}>PT {store.storeNumber}</td>
                                                <td style={{ textAlign: 'center' }}>{store.storeRegion}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <StatusDot value={getStatus(store.storeSurveys)} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <StatusDot value={getStatus(store.storeProvisioning)} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <StatusDot value={getStatus(store.storePhase1)} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <StatusDot value={getStatus(store.storePhase2)} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {store.storeSurveys?.[0]?.surveyOpeningDate
                                                        ? new Date(store.storeSurveys[0].surveyOpeningDate).toLocaleDateString('pt-PT')
                                                        : '---'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <Tooltip title="Ver detalhes" placement="top">
                                                        <IconButton
                                                            size="sm"
                                                            variant="plain"
                                                            color="neutral"
                                                            onClick={() => navigate(`/stores/${store.id}`)}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </Table>
                        </div>

                        <Box
                            className="pagination-controls"
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 3,
                                flexWrap: 'wrap',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StatusDot status="notStarted" />
                                    <Typography level="body-sm" sx={{ ml: 1 }}>Não iniciado</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StatusDot status="partial" />
                                    <Typography level="body-sm" sx={{ ml: 1 }}>Parcial</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StatusDot status="complete" />
                                    <Typography level="body-sm" sx={{ ml: 1 }}>Completo</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                    <Typography level="body-sm" sx={{ mr: 1 }}>
                                        Resultados por página:
                                    </Typography>
                                    <Select
                                        className="page-size-select"
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

                                <Button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
                                    Anterior
                                </Button>

                                <Typography level="body-md">
                                    Página {page} de {Math.ceil(total / pageSize)}
                                </Typography>

                                <Button disabled={page * pageSize >= total} onClick={() => setPage((prev) => prev + 1)}>
                                    Seguinte
                                </Button>
                            </Box>
                        </Box>
                    </Sheet>
                </main>
            </CssVarsProvider>
        </>
    );
}
