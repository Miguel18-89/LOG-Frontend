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

// Componente auxiliar para bolinha de status
function StatusDot({ value }) {
    const colorMap = {
        //0: '#d32f2f', // vermelho
        1: '#fbc02d', // amarelo
        2: '#388e3c', // verde
    };

    return (
        <Box
            sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: colorMap[value] || '#9e9e9e',
                mx: 'auto',
            }}
        />
    );
}

function getStatus(array) {
    return Array.isArray(array) && array.length > 0 ? array[0].status : null;
}

export default function UpCommingStores() {
    const [stores, setStores] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores/UpComming');
                setStores(response.data.allUpCommingStores); // ajusta conforme estrutura da API
            } catch (error) {
                console.error('Erro ao buscar lojas:', error);
            }
        };
        fetchStores();
    }, []);

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
                            Próximas lojas
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
                    </Sheet>
                </main>
            </CssVarsProvider>
        </>
    );
}