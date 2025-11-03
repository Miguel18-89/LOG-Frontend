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
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function StoreSurveyForm({ storeId, initialData }) {
    const [survey, setSurvey] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });
    const [updatedByName, setUpdatedByName] = useState("")
    const [currentLoggedUser, setCurrentLoggedUser] = useState({});
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
        if (formData?.surveyPhase1Date) {
            setSurveyPhase1Text(formatDate(formData.surveyPhase1Date));
        }
    }, [formData.surveyPhase1Date]);

    useEffect(() => {
        if (formData?.surveyPhase2Date) {
            setSurveyPhase2Text(formatDate(formData.surveyPhase2Date));
        }
    }, [formData.surveyPhase2Date]);

    useEffect(() => {
        if (formData?.surveyOpeningDate) {
            setSurveyOpeningDateText(formatDate(formData.surveyOpeningDate));
        }
    }, [formData.surveyOpeningDate]);



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
        const cleanedFormData = {
            ...formData,
            surveyOpeningDate:
                surveyOpeningDate === '' || surveyOpeningDate === null
                    ? null
                    : parseDate(surveyOpeningDate),
            surveyPhase1Date:
                surveyPhase1Text === '' || surveyPhase1Text === null
                    ? null
                    : parseDate(surveyPhase1Text),
            surveyPhase2Date:
                surveyPhase2Text === '' || surveyPhase2Text === null
                    ? null
                    : parseDate(surveyPhase2Text),
        };

        try {
            console.log("Dados enviados:", cleanedFormData, storeId);

            const res = await toast.promise(
                api.put(`/surveys/${formData.id}`, {
                    ...cleanedFormData,
                    storeId,
                    userId: currentLoggedUser.id,
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
            console.log("Resposta da API:", updated);

            if (updated?.updated_by) {
                try {
                    const updatedUser = await api.get(`/users/${updated.updated_by}`);
                    setUpdatedByName(updatedUser.data.name ?? 'Desconhecido');
                } catch (err) {
                    console.error('Erro ao buscar nome do utilizador:', err);
                    setUpdatedByName('Desconhecido');
                }
            } else {
                setUpdatedByName('Desconhecido');
            }

        } catch (error) {
            console.error("Erro ao guardar survey:", error);
            toast.error("Ocorreu um erro ao guardar o survey.");
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                        {isValidDate(formData.updated_at) && (
                            <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                Atualizado por {updatedByName ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            </Typography>
                        )}
                        {[1, 2].includes(currentLoggedUser.role) && (
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
                        type="date"
                        value={formData.surveyPhase1Date
                            ? new Date(formData.surveyPhase1Date).toISOString().split("T")[0]
                            : ""}
                        onChange={(e) => handleChange("surveyPhase1Date", e.target.value)}
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyPhase1Date', parsed);
                            }
                        }}
                        placeholder="DD/MM/AAAA"
                        readOnly={!isEditing}
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
                        type="date"
                        value={formData.surveyPhase2Date
                            ? new Date(formData.surveyPhase2Date).toISOString().split("T")[0]
                            : ""}
                        onChange={(e) => handleChange("surveyPhase2Date", e.target.value)}
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyPhase2Date', parsed);
                            }
                        }}
                        placeholder="DD/MM/AAAA"
                        readOnly={!isEditing}
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
                    <FormLabel>Data prevista para a abertura</FormLabel>
                    <Input
                        type="date"
                        value={formData.surveyOpeningDate
                            ? new Date(formData.surveyOpeningDate).toISOString().split("T")[0]
                            : ""}
                        onChange={(e) => handleChange("surveyOpeningDate", e.target.value)}
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyOpeningDate', parsed);
                            }
                        }}
                        placeholder="DD/MM/AAAA"
                        readOnly={!isEditing}
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