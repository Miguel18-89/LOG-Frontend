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
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';




export default function StorePhase2Form({ storeId, initialData }) {
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

            const res = await api.put(`/phase2/${formData.id}`, {
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
                2ª Fase
            </Typography>

            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '8px' }}>
                {!isEditing ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                        <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                            Atualizado por {updatedByName ?? 'Desconhecido5'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
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
                <Checkbox
                    label="Kls"
                    checked={formData.kls}
                    onChange={(e) => handleChange('kls', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Acrilicos"
                    checked={formData.acrylics}
                    onChange={(e) => handleChange('acrylics', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="HotButtons"
                    checked={formData.hotButtons}
                    onChange={(e) => handleChange('hotButtons', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="EAS"
                    checked={formData.eas}
                    onChange={(e) => handleChange('eas', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Tiko"
                    checked={formData.tiko}
                    onChange={(e) => handleChange('tiko', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Checkbox
                    label="SMC"
                    checked={formData.smc}
                    onChange={(e) => handleChange('smc', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Amplificador"
                    checked={formData.amplifier}
                    onChange={(e) => handleChange('amplifier', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Fornos"
                    checked={formData.ovens}
                    onChange={(e) => handleChange('ovens', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Testes"
                    checked={formData.tests}
                    onChange={(e) => handleChange('tests', e.target.checked)}
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