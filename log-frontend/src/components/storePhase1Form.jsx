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
import { useState, useEffect } from 'react';
import api from '../services/api';
import Gesture from '@mui/icons-material/Gesture';
import Speaker from '@mui/icons-material/Speaker';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-toastify';



export default function StorePhase1Form({ storeId, initialData }) {
    const [survey, setSurvey] = useState("")
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
            api.put(`/phase1/${formData.id}`, {
                ...formData,
                storeId,
                userId: currentLoggedUser.id,
            }),
            {
                    pending: 'A atualizar...',
                    success: 'Actualizado com sucesso!',
                    error: 'Erro ao atualizar o survey.',
                }
            );

            setIsEditing(false);

            const updated = res.data;
            setFormData(updated);
            setUpdatedData(updated);

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
            sx={{
                position: 'relative',
                //width: 700,
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
            <Typography level="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                1ª Fase
            </Typography>

            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '8px' }}>
                {!isEditing ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                        {isValidDate(formData.updated_at) && (
                            <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                Atualizado por {updatedByName ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            </Typography>
                        )}


                        {[0, 2].includes(currentLoggedUser.role) && (
                            <Tooltip title="Editar">
                                <IconButton onClick={() => setIsEditing(true)}>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                    </Box>
                )}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Gesture sx={{ fontSize: 24 }} />
                <Typography level="title-md">Cabos  :  </Typography>
                <Checkbox
                    label="Loja"
                    checked={formData.cablesSalesArea}
                    onChange={(e) => handleChange('cablesSalesArea', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Padaria"
                    checked={formData.cablesBakery}
                    onChange={(e) => handleChange('cablesBakery', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Armazém"
                    checked={formData.cablesWarehouse}
                    onChange={(e) => handleChange('cablesWarehouse', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Backoffice"
                    checked={formData.cablesBackoffice}
                    onChange={(e) => handleChange('cablesBackoffice', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Speaker sx={{ fontSize: 24 }} />
                <Typography level="title-md">Colunas : </Typography>
                <Checkbox
                    label="Loja"
                    checked={formData.speakersSalesArea}
                    onChange={(e) => handleChange('speakersSalesArea', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Padaria"
                    checked={formData.speakersBakery}
                    onChange={(e) => handleChange('speakersBakery', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Armazém"
                    checked={formData.speakersWarehouse}
                    onChange={(e) => handleChange('speakersWarehouse', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Backoffice"
                    checked={formData.speakersBackoffice}
                    onChange={(e) => handleChange('speakersBackoffice', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>
            <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                    size="lg"
                    sx={{
                        minHeight: '48px'
                    }}
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