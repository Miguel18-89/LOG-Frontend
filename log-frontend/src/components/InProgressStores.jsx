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

const statusColors = {
    //notStarted: '#B0BEC5',   // cinza
    partial: '#fbc02d',    // amarelo
    complete: '#388e3c',   // verde
};

const valueColors = {
    //0: '#d32f2f',            // vermelho
    1: '#fbc02d',            // amarelo
    2: '#388e3c',            // verde
};

function StatusDot({ status, value }) {
    const backgroundColor =
        statusColors[status] ||
        valueColors[value] ||
        '#9e9e9e'; // fallback cinza

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

export default function InProgressStores() {
    const [stores, setStores] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();


    const fetchStores = async () => {
        try {
            const response = await api.get('/stores/InProgress', {
                params: { page, pageSize },
            });
            setStores(response.data.allInProgressStores);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Erro ao buscar lojas:', error);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [page, pageSize]);

    return (
        <>
            <Navbar />
            <CssVarsProvider>
                <main style={{ padding: '2rem' }}>
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
                            Lojas em curso
                        </Typography>

                        <Table borderAxis="xBetween" size="md" stripe="odd">
                            <thead>
                                <tr>
                                    <th>Nome</th>
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
                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <StatusDot value={getStatus(store.storeSurveys)} />
                                                </Box>
                                            </td>

                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <StatusDot value={getStatus(store.storeProvisioning)} />
                                                </Box>
                                            </td>

                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <StatusDot value={getStatus(store.storePhase1)} />
                                                </Box>
                                            </td>

                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <StatusDot value={getStatus(store.storePhase2)} />
                                                </Box>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {store.storeSurveys?.[0]?.surveyOpeningDate
                                                    ? new Date(store.storeSurveys[0].surveyOpeningDate).toLocaleDateString('pt-PT')
                                                    : '---'}
                                            </td>
                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
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
                        <br />
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '16px' }}>
                            <Box
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
                            </Box>
                        </div>
                    </Sheet>
                </main>
            </CssVarsProvider>
        </>
    );
}