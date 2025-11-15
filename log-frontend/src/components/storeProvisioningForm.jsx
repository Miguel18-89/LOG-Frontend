import {
    Typography,
    Sheet,
    FormControl,
    FormLabel,
    Input,
    Select,
    Option,
    Checkbox,
    IconButton,
    Tooltip,
    Divider,
    Box
} from '@mui/joy';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-toastify';
import '../styles/StoreProvisioningForm.css';

export default function StoreProvisioningForm({ storeId, initialData }) {
    const [provisioning, setProvisioning] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });
    const [currentLoggedUser, setCurrentLoggedUser] = useState({});
    const [updatedByName, setUpdatedByName] = useState("")
    const [updatedData, setUpdatedData] = useState({ ...initialData })

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
    const [surveyPhase1Text, setSurveyPhase1Text] = useState('');
    const [surveyPhase2Text, setSurveyPhase2Text] = useState('');
    const [surveyOpeningDate, setSurveyOpeningDateText] = useState('');

    const isValidDate = (value) => {
        const date = new Date(value);
        return value && !isNaN(date.getTime());
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, []);



    useEffect(() => {
        const fetchUpdatedByName = async () => {
            if (initialData?.updated_by) {
                try {
                    const res = await api.get(`/users/${initialData.updated_by}`);
                    setUpdatedByName(res.data.name ?? 'Desconhecido20');
                } catch (err) {
                    console.error('Erro ao buscar nome do utilizador:', err);
                    setUpdatedByName('Desconhecido');
                }
            }
        };

        if (initialData) {
            setFormData((prev) => ({ ...prev, ...initialData }));
            fetchUpdatedByName();
        }
    }, [initialData]);


    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            console.log("Dados enviados:", formData, storeId);

            const res = await toast.promise(
                api.put(`/provisioning/${formData.id}`, {
                    ...formData,
                    storeId,
                    userId: currentLoggedUser.id,
                    updated_by: currentLoggedUser.id
                }),
                {
                    pending: 'A atualizar...',
                    success: 'Actualizado com sucesso!',
                    error: 'Erro ao atualizar o survey.',
                }
            );

            const updated = res.data;
            setFormData(updated);
            setUpdatedData(updated);
            setIsEditing(false);
            console.log(formData)

            if (updated?.updated_by) {
                try {
                    const updatedUser = await api.get(`/users/${updated.updated_by}`);

                    setUpdatedByName(updatedUser.data.name ?? 'Desconhecido');

                } catch (err) {
                    console.error('Erro ao buscar nome do utilizador:', err);
                    setUpdatedByName('Desconhecido');
                }
            } else {
                console.warn('updated_by está ausente na resposta');
                setUpdatedByName('Desconhecido');
            }

        } catch (error) {
            console.error("Erro ao guardar:", error);
            toast.error("Ocorreu um erro ao guardar.");
        }
    };

    return (
        <Sheet
            className="provisioning-form-sheet"
            sx={{
                position: 'relative',
                mx: 'auto',
                py: 3,
                px: 2,
                mt: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                borderRadius: 'sm',
                boxShadow: 'lg',
                backgroundColor: '#fff',
            }}
            variant="outlined"
        >
            {/* Botões de ação no topo, alinhados à direita */}
            <div className="provisioning-action-buttons-area">
                {!isEditing ? (
                    <>
                        {isValidDate(formData.updated_at) && (
                            <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                Atualizado por {updatedByName ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            </Typography>
                        )}
                        {[1, 2].includes(currentLoggedUser.role) && (
                            <div className="provisioning-edit-buttons-group">
                                <Tooltip title="Editar">
                                    <IconButton onClick={() => setIsEditing(true)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="provisioning-edit-buttons-group">
                        <Tooltip title="Guardar">
                            <IconButton onClick={handleSave}>
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Sair sem guardar">
                            <IconButton
                                color="neutral"
                                onClick={() => {
                                    setFormData(updatedData);
                                    setIsEditing(false);
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Título */}
            <Typography level="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                Aprovisionamento
            </Typography>

            <div className="provisioning-checkbox-row">
                <Checkbox
                    label="Encomendado"
                    checked={formData.ordered}
                    onChange={(e) => handleChange('ordered', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Recebido"
                    checked={formData.received}
                    onChange={(e) => handleChange('received', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Validado"
                    checked={formData.validated}
                    onChange={(e) => handleChange('validated', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>

            <div className="provisioning-form-row">
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Número de tracking</FormLabel>
                    <Input
                        type="text"
                        value={formData.trackingNumber}
                        onChange={(e) => handleChange('trackingNumber', e.target.value)}
                        readOnly={!isEditing}
                        endDecorator={
                            !isEditing && formData.trackingNumber && (
                                <Tooltip title="Localizar">
                                    <IconButton
                                        component="a"
                                        href={`https://elogistics.dachser.com/shp2s/?search=${encodeURIComponent(formData.trackingNumber)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="ml"
                                        color="neutral"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </Tooltip>
                            )
                        }
                    />
                </FormControl>
            </div>

            <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                    size="lg"
                    sx={{ minHeight: '48px' }}
                    value={formData.status}
                    onChange={(e, val) => handleChange('status', parseInt(val))}
                    disabled={!isEditing}
                >
                    <Option value={0}>Não iniciado</Option>
                    <Option value={1}>Parcial</Option>
                    <Option value={2}>Completo</Option>
                </Select>
            </FormControl>
        </Sheet>
    );
}