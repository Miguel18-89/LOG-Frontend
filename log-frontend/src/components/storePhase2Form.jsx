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
import '../styles/StorePhase2Form.css';



export default function StorePhase2Form({ storeId, initialData }) {
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
                api.put(`/phase2/${formData.id}`, {
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
            setUpdatedData(updated)

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
            className="phase2-form-sheet"
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
            <div className="phase2-action-buttons-area">
                {!isEditing ? (
                    <>
                        {isValidDate(formData.updated_at) && (
                            <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                                Atualizado por {updatedByName ?? 'Desconhecido'} em {format(new Date(formData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            </Typography>
                        )}
                        {[0, 2].includes(currentLoggedUser.role) && (
                            <div className="phase2-edit-buttons-group">
                                <Tooltip title="Editar">
                                    <IconButton onClick={() => setIsEditing(true)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="phase2-edit-buttons-group">
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
                2ª Fase
            </Typography>

            <div className="phase2-checkbox-row">
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
                    label="Amplificador"
                    checked={formData.amplifier}
                    onChange={(e) => handleChange('amplifier', e.target.checked)}
                    disabled={!isEditing}
                />
                <Checkbox
                    label="SMC"
                    checked={formData.smc}
                    onChange={(e) => handleChange('smc', e.target.checked)}
                    disabled={!isEditing}
                />
            </div>

            <div className="phase2-checkbox-row">
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
                <Checkbox
                    label="Headsets"
                    checked={formData.quailDigital}
                    onChange={(e) => handleChange('quailDigital', e.target.checked)}
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