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

export default function StoreSurveyForm({ storeId, initialData }) {
    const [survey, setSurvey] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });
    const [updatedByName, setUpdatedByName] = useState("")
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
    const [surveyPhase1Text, setSurveyPhase1Text] = useState('');
    const [surveyPhase2Text, setSurveyPhase2Text] = useState('');
    const [surveyOpeningDate, setSurveyOpeningDateText] = useState('');

    const sanitizeSurveyDates = (data) => ({
        ...data,
        surveyPhase1Date: isValidDate(data.surveyPhase1Date) ? data.surveyPhase1Date : null,
        surveyPhase2Date: isValidDate(data.surveyPhase2Date) ? data.surveyPhase2Date : null,
        updated_at: isValidDate(data.updated_at) ? data.updated_at : null,
    });

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

            const res = await api.put(`/surveys/${formData.id}`, {
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

            const updated = sanitizeSurveyDates(res.data);
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                        {isValidDate(formData.updated_at) && (
                            <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                Atualizado por {updatedByName ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            </Typography>
                        )}
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
                        value={surveyPhase1Text}
                        onChange={(e) => setSurveyPhase1Text(e.target.value)} // permite digitar livremente
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyPhase1Date', parsed); // só atualiza o estado real se for válido
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
                        type="text"
                        value={surveyPhase2Text}
                        onChange={(e) => setSurveyPhase2Text(e.target.value)} // permite digitar livremente
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyPhase2Date', parsed); // só atualiza o estado real se for válido
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
                        type="text"
                        value={surveyOpeningDate}
                        onChange={(e) => setSurveyOpeningDateText(e.target.value)} // permite digitar livremente
                        onBlur={(e) => {
                            const parsed = parseDate(e.target.value);
                            if (parsed) {
                                handleChange('surveyOpeningDate', parsed); // só atualiza o estado real se for válido
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