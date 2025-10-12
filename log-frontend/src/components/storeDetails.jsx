import { useEffect, useState } from 'react';
import { useAsyncError, useParams, useNavigate } from 'react-router-dom';
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
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import Tooltip from '@mui/joy/Tooltip';
import StoreSurveyForm from './storeSurveyForm';
import StoreProvisioningForm from './storeProvisioningForm';
import StorePhase1Form from './storePhase1Form';
import StorePhase2Form from './storePhase2Form';
import StoreComments from './storeComments';
import { Box } from '@mui/joy';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';




export default function StoreDetails() {
    const navigate = useNavigate();
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
        updated_at: null,
    });

    const [provisioning, setProvisioning] = useState({
        ordered: false,
        trackingNumber: "",
        received: false,
        validated: false,
        status: 0,
        updated_at: null,
    });

    const [phase1, setPhase1] = useState({
        cablesSalesArea: false,
        cablesBakery: false,
        cablesWarehouse: false,
        cablesBackoffice: false,
        speakersSalesArea: false,
        speakersBakery: false,
        speakersWarehouse: false,
        speakersBackoffice: false,
        status: 0,
        updated_at: null,
    })

    const [phase2, setPhase2] = useState({
        kls: false,
        acrylics: false,
        hotButtons: false,
        eas: false,
        tiko: false,
        ovens: false,
        smc: false,
        amplifier: false,
        tests: false,
        status: 0,
        updated_at: null,
    })

    const [comments, setComments] = useState({
        message: "",
    })

    const [currentLoggedUser, setCurrentLoggedUser] = useState({});


    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        if (!isoDate || isNaN(date)) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDate = (ddmmyyyy) => {
        const [day, month, year] = ddmmyyyy.split('/');
        if (!day || !month || !year) return null;
        const iso = new Date(`${year}-${month}-${day}`);
        return isNaN(iso) ? null : iso.toISOString();
    };

    const isValidDate = (value) => {
        const date = new Date(value);
        return value && !isNaN(date.getTime());
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, [isEditing]);

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
                if (response.data.storePhase1?.length > 0) {
                    setPhase1(response.data.storePhase1[0]);
                }
                if (response.data.storePhase2?.length > 0) {
                    setPhase2(response.data.storePhase2[0]);
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
            const res = await api.put(`/stores/${store.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(res.data)
            setFormData(res.data)
            alert("Loja atualizada com sucesso!");
            setIsEditing(false);
            setStore(formData);
            

        } catch (error) {
            console.error("Erro ao atualizar loja:", error);
            alert("Erro ao guardar alterações.");
        }
    };

    const handleDelete = async () => {
        const confirm = window.confirm('Eliminar esta loja e dados associados?');
        if (!confirm) return;
        try {
            await api.delete(`/stores/${store.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Loja eliminada com sucesso!");
            navigate("/home")

        } catch (error) {
            console.error("Erro ao eliminar loja:", error);
            alert("Erro ao eliminar loja.");
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
                                <FormLabel>Número (PT)</FormLabel>
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
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                                    {isValidDate(formData.updated_at) && (
                                        <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                            Atualizado por {formData.updatedBy.name ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                                        </Typography>
                                    )}
                                    {[1, 2].includes(currentLoggedUser.role) && (
                                        <Box>

                                            <Tooltip title="Editar">
                                                <IconButton onClick={() => setIsEditing(true)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar Loja">
                                                <IconButton onClick={handleDelete}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </div>

                            ) : (
                                <Tooltip title="Guardar">
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
                    {phase1 && (
                        <StorePhase1Form
                            initialData={phase1}
                            storeId={store.id}
                        />
                    )}
                    {phase2 && (
                        <StorePhase2Form
                            initialData={phase2}
                            storeId={store.id}
                        />
                    )}

                    {comments && (
                        <StoreComments
                            initialData={comments}
                            storeId={store.id}
                        />
                    )}

                </main>
            </CssVarsProvider>
        </>
    );
}