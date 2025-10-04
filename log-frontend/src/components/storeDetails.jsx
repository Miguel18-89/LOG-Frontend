import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import CircularProgress from '@mui/joy/CircularProgress';
import Navbar from './Navbar';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Tooltip from '@mui/joy/Tooltip';
import StoreSurveyForm from './storeSurveyForm';
import StoreProvisioningForm from './storeProvisioningForm';



export default function StoreDetails() {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isSurveyEditing, setIsSurveyEditing] = useState(false);

    const [survey, setSurvey] = useState({
        surveyHasFalseCeilling: false,
        surveyMetalFalseCeilling: false,
        surveyCheckoutCount: 0,
        surveyHasElectronicGates: false,
        surveyArea: 0,
        surveyPhase1Date: '',
        surveyPhase1Type: '',
        surveyPhase2Date: '',
        surveyPhase2Type: '',
        surveyOpeningDate: '',
        surveyHeadsets: '',
        surveyHasBread: false,
        surveyHasChicken: false,
        surveyHasCodfish: false,
        surveyHasNewOvens: false,
        status: 0,
    });

    const [provisioning, setProvisioning] = useState({
        ordered: false,
        trackingNumber: "",
        received: false,
        validated: false,
        status: 0,
    });

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const response = await api.get(`/stores/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("Dados da loja:", response.data);
                setStore(response.data);
                setFormData(response.data);
                if (response.data.storeSurveys?.length > 0) {
                    setSurvey(response.data.storeSurveys[0]);
                }
                if (response.data.storeProvisioning?.length > 0) {
                    setProvisioning(response.data.storeProvisioning[0]);
                }
            } catch (error) {
                console.error("Erro ao buscar loja:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id && token) {
            fetchStore();
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            await api.put(`/stores/${store.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Loja atualizada com sucesso!");
            setIsEditing(false);
            setStore(formData);

        } catch (error) {
            console.error("Erro ao atualizar loja:", error);
            alert("Erro ao guardar alterações.");
        }
    };


    if (loading) return <CircularProgress />;
    if (!store) return <Typography color="danger">Loja não encontrada.</Typography>;

    return (
        <>
            <Navbar />
            <CssVarsProvider>
                <main style={{ paddingTop: '30px' }}>
                    <Sheet
                        sx={{
                            width: 700,
                            mx: 'auto',
                            py: 3,
                            px: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            borderRadius: 'sm',
                            boxShadow: 'lg',
                            backgroundColor: '#fff',
                            position: 'relative',

                        }}
                        variant="outlined"
                    >
                        <Typography level="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                            Detalhes da Loja
                        </Typography>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <FormControl sx={{ flex: 2 }}>
                                <FormLabel>Nome da Loja</FormLabel>
                                <Input
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    readOnly={!isEditing}
                                />

                            </FormControl>

                            <FormControl sx={{ width: '120px' }}>
                                <FormLabel>Número</FormLabel>
                                <Input
                                    name="storeNumber"
                                    value={formData.storeNumber}
                                    onChange={handleChange}
                                    readOnly
                                />
                            </FormControl>

                            <FormControl sx={{ flex: 1, maxWidth: '160px' }}>
                                <FormLabel>Região</FormLabel>
                                <Select value={store.storeRegion} disabled size="lg" sx={{ height: '40px' }}>
                                    <Option value="Norte">Norte</Option>
                                    <Option value="Centro">Centro</Option>
                                    <Option value="Sul">Sul</Option>
                                    <Option value="Oeste">Oeste</Option>
                                </Select>
                            </FormControl>
                        </div>


                        <FormControl>
                            <FormLabel>Morada</FormLabel>
                            <Input
                                name="storeAddress"
                                value={formData.storeAddress}
                                onChange={handleChange}
                                readOnly={!isEditing}
                            />
                        </FormControl>

                        <Typography level="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                            Fiscalização
                        </Typography>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel>Nome</FormLabel>
                                <Input
                                    name="storeInspectorName"
                                    value={formData.storeInspectorName}
                                    onChange={handleChange}
                                    readOnly={!isEditing}
                                />
                            </FormControl>

                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel>Contacto</FormLabel>
                                <Input
                                    name="storeInspectorContact"
                                    value={formData.storeInspectorContact}
                                    onChange={handleChange}
                                    readOnly={!isEditing}
                                />
                            </FormControl>
                        </div>
                        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '8px' }}>
                            {!isEditing ? (
                                <Tooltip title="Editar loja">
                                    <IconButton onClick={() => setIsEditing(true)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Guardar alterações">
                                    <IconButton onClick={handleSave}>
                                        <SaveIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>
                    </Sheet>
                    {survey && (
                        <StoreSurveyForm
                            initialData={survey}
                            storeId={store.id}
                        />
                    )}
                    {provisioning && (
                        <StoreProvisioningForm
                            initialData={provisioning}
                            storeId={store.id}
                        />
                    )}


                </main>
            </CssVarsProvider>
        </>
    );
}