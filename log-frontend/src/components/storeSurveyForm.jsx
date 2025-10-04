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

export default function StoreSurveyForm({ storeId, initialData }) {
    const [survey, setSurvey] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });

    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };



    const parseDate = (ddmmyyyy) => {
        const [day, month, year] = ddmmyyyy.split('/');
        if (!day || !month || !year) return '';
        const iso = new Date(`${year}-${month}-${day}`).toISOString();
        return iso;
    };

    const [currentLoggedUser, setCurrentLoggedUser] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({ ...prev, ...initialData }));
        }
    }, [initialData]);


    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            console.log("Dados enviados:", formData, storeId);

            await api.put(`/surveys/${formData.id}`, {
                ...formData,
                storeId,
                userId: currentLoggedUser.id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Survey guardado com sucesso!");
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao guardar survey:", error);
            alert("Ocorreu um erro ao guardar o survey.");
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
                Survey da Loja
            </Typography>

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




            <div style={{ display: 'flex', gap: '16px' }}>

                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Área de Vendas</FormLabel>
                    <Input
                        type="number"
                        value={formData.surveyArea}
                        onChange={(e) => handleChange('surveyArea', parseInt(e.target.value))}
                        readOnly={!isEditing}
                    />
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Nº de Checkouts</FormLabel>
                    <Input
                        type="number"
                        value={formData.surveyCheckoutCount}
                        onChange={(e) => handleChange('surveyCheckoutCount', parseInt(e.target.value))}
                        readOnly={!isEditing}
                    />
                </FormControl>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Data prevista para 1ª fase</FormLabel>
                    <Input
                        type="text"
                        value={formatDate(formData.surveyPhase1Date)}
                        onChange={(e) => handleChange('surveyPhase1Date', parseDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                    />

                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>1ª Fase: Nocturno / Diurno</FormLabel>
                    <Select
                        size="lg"
                        sx={{
                            minHeight: '48px'
                        }}
                        value={formData.surveyPhase1Type}
                        onChange={(e, val) => handleChange('surveyPhase1Type', val)}
                        disabled={!isEditing}
                    >
                        <Option value="Diurno">Diurno</Option>
                        <Option value="Nocturno">Nocturno</Option>
                    </Select>
                </FormControl>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Data prevista para 2ª fase</FormLabel>
                    <Input
                        type="text"
                        value={formatDate(formData.surveyPhase2Date)}
                        onChange={(e) => handleChange('surveyPhase2Date', parseDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                    />
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>2ª Fase: Nocturno / Diurno</FormLabel>
                    <Select
                        size="lg"
                        sx={{
                            minHeight: '48px'
                        }}

                        value={formData.surveyPhase2Type}
                        onChange={(e, val) => handleChange('surveyPhase2Type', val)}
                        disabled={!isEditing}
                    >
                        <Option value="Diurno">Diurno</Option>
                        <Option value="Nocturno">Nocturno</Option>
                    </Select>
                </FormControl>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Data prevista para abertura</FormLabel>
                    <Input
                        type="text"
                        value={formatDate(formData.surveyOpeningDate)}
                        onChange={(e) => handleChange('surveyOpeningDate', parseDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                    />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Headsets</FormLabel>
                    <Select
                        size="lg"
                        sx={{
                            minHeight: '48px'
                        }}
                        value={formData.surveyHeadsets}
                        onChange={(e, val) => handleChange('surveyHeadsets', val)}
                        disabled={!isEditing}
                    >
                        <Option value="Quail">Quail</Option>
                        <Option value="Vocovo">Vocovo</Option>
                    </Select>
                </FormControl>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Checkbox
                    label="Pão Quente"
                    checked={formData.surveyHasBread}
                    onChange={(e) => handleChange('surveyHasBread', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Frango Quente"
                    checked={formData.surveyHasChicken}
                    onChange={(e) => handleChange('surveyHasChicken', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Bacalhau"
                    checked={formData.surveyHasCodfish}
                    onChange={(e) => handleChange('surveyHasCodfish', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Fornos Novos"
                    checked={formData.surveyHasNewOvens}
                    onChange={(e) => handleChange('surveyHasNewOvens', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Checkbox
                    label="Teto Falso"
                    checked={formData.surveyHasFalseCeilling}
                    onChange={(e) => handleChange('surveyHasFalseCeilling', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Teto Metálico"
                    checked={formData.surveyMetalFalseCeilling}
                    onChange={(e) => handleChange('surveyMetalFalseCeilling', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="Cancelas Eletrónicas"
                    checked={formData.surveyHasElectronicGates}
                    onChange={(e) => handleChange('surveyHasElectronicGates', e.target.checked)}
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