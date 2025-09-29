import { useEffect, useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Navbar from './Navbar';
import api from '../services/api';
import Button from '@mui/joy/Button';
import { useNavigate } from 'react-router-dom';

export default function StoreList() {
    const [stores, setStores] = useState([]);
    const navigate = useNavigate()

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores');
                console.log(response.data);
                setStores(response.data.allStores);
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
                        <Typography level="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00' }}>
                            Lista de Lojas
                        </Typography>

                        <Table borderAxis="xBetween" size="md" stripe="odd">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Número</th>
                                    <th>Morada</th>
                                    <th>Região</th>
                                    <th>Área</th>
                                    <th>Fiscalização</th>
                                    <th>Detalhes</th>
                                </tr>
                            </thead>

                            <tbody>
                                {Array.isArray(stores) && stores.map((store) => (
                                    <tr key={store.id}>
                                        <td>{store.storeName}</td>
                                        <td>{store.storeNumber}</td>
                                        <td>{store.storeAddress}</td>
                                        <td>{store.storeRegion}</td>
                                        <td>{store.storeArea} m²</td>
                                        <td>{store.storeInspectorName}</td>
                                        <td>
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/stores/${store.id}`)}
                                            >
                                                Ver
                                            </Button>
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

/*
import { useEffect, useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Button from '@mui/joy/Button';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import api from '../services/api';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/stores');
        setStores(response.data);
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
              maxWidth: 1200,
              mx: 'auto',
              p: 3,
              borderRadius: 'sm',
              boxShadow: 'lg',
              backgroundColor: '#fff',
            }}
            variant="outlined"
          >
            <Typography level="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00' }}>
              Lojas
            </Typography>

            <Table borderAxis="xBetween" size="md" stripe="odd">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Número</th>
                  <th>Survey</th>
                  <th>Aprovisionamento</th>
                  <th>1ª Fase</th>
                  <th>2ª Fase</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(stores) && stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.storeName}</td>
                    <td>{store.storeNumber}</td>
                    <td>{store.survey?.status || '—'}</td>
                    <td>{store.provisioning?.status || '—'}</td>
                    <td>{store.phaseOne?.status || '—'}</td>
                    <td>{store.phaseTwo?.status || '—'}</td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/lojas/${store.id}`)}
                      >
                        Ver
                      </Button>
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
  */