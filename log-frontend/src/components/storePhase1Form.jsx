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
} from '@mui/joy';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Gesture from '@mui/icons-material/Gesture';
import Speaker from '@mui/icons-material/Speaker';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';



export default function StorePhase1Form({ storeId, initialData }) {
    const [survey, setSurvey] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });
    const [currentLoggedUser, setCurrentLoggedUser] = useState({});
    const [updatedByName, setUpdatedByName] = useState("")

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
                    const res = await api.get(`/users/${initialData.updated_by}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
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

            const res = await api.put(`/phase1/${formData.id}`, {
                ...formData,
                storeId,
                userId: currentLoggedUser.id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Guardado com sucesso!");
            setIsEditing(false);

            const updated = res.data;
            setFormData(updated);

            if (updated?.updated_by) {
                try {
                    const updatedUser = await api.get(`/users/${updated.updated_by}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

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
            alert("Ocorreu um erro ao guardar.");
        }
    };

    return (
        <Sheet
            sx={{
                position: 'relative',
                width: 700,
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
                        <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                            Atualizado por {updatedByName ?? 'Desconhecido5'} em{' '}
                            {formData.updated_at
                                ? format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })
                                : 'data desconhecida'}
                        </Typography>


                        <Tooltip title="Editar">
                            <IconButton onClick={() => setIsEditing(true)}>
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                ) : (
                    <Tooltip title="Guardar">
                        <IconButton onClick={handleSave}>
                            <SaveIcon />
                        </IconButton>
                    </Tooltip>
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
                    checked={formData.cablesbakery}
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
                    checked={formData.speakersbakery}
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