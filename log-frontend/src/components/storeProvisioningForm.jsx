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

export default function StoreProvisioningForm({ storeId, initialData }) {
    const [provisioning, setProvisioning] = useState("")
    const token = localStorage.getItem('token');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...initialData });
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

            await api.put(`/provisioning/${formData.id}`, {
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
                Aprovisionamento
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

            <div style={{ display: 'flex', gap: '16px' }}>


                <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Número de tracking</FormLabel>
                    <Input
                        type="text"
                        value={formData.trackingNumber}
                        onChange={(e) => handleChange('trackingNumber', e.target.value)}
                        readOnly={!isEditing}
                    />
                </FormControl>
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