import { useState, useEffect } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import './components.css';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'

export default function NewStore() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const currentLoggedUser = JSON.parse(localStorage.getItem('user'));
    const [formData, setFormData] = useState({
        storeName: '',
        storeNumber: '',
        storeAddress: '',
        storeRegion: '',
        storeInspectorName: '',
        storeInspectorContact: '',
        userId: currentLoggedUser.id
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = [];

        if (!formData.storeName.trim()) {
            errors.push("O campo Nome é obrigatório.");
        }

        if (!formData.storeNumber.trim()) {
            errors.push("O campo Número da Loja é obrigatório.");
        }

        if (Number(formData.storeNumber) <= 0 || (!Number(formData.storeNumber))) {
            errors.push("A Número de loja não é válido.");
        }

        if (isNaN(formData.storeNumber) || Number(formData.storeNumber) <= 0) {
            errors.push("O Número da Loja deve ser um número válido.");
        }


        if (formData.storeInspectorContact == "") {
        }
        else {
            if (isNaN(formData.storeInspectorContact) || formData.storeInspectorContact.length < 9) {
                errors.push("O telefone da fiscalização deve conter apenas números e ter pelo menos 9 dígitos.");
            }
        }

        if (errors.length > 0) {
            alert("Erros no formulário:\n\n" + errors.join("\n"));
            return;
        }

        console.log(formData)
        try {
            await api.post('/stores', {
                ...formData,
                storeNumber: Number(formData.storeNumber),
                storeInspectorContact: formData.storeInspectorContact ? Number(formData.storeInspectorContact) : null,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Loja adicionada com sucesso!");
            navigate("/Home");

        } catch (error) {
            if (error.response) {
                alert(JSON.stringify(error.response?.data));
            } else {
                alert("Erro ao comunicar com o servidor.");
            }
        }
    };

    return (
        <>
            <div><Navbar></Navbar></div>
            <div>
                <CssVarsProvider>
                    <main id="form">
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
                            }}
                            variant="outlined"
                        >
                            <Typography level="h4" component="h1" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                                Adicionar Nova Loja
                            </Typography>

                            <FormControl>
                                <FormLabel>Nome da Loja</FormLabel>
                                <Input name="storeName" value={formData.storeName} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Número</FormLabel>
                                <Input name="storeNumber"
                                    value={formData.storeNumber} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Morada</FormLabel>
                                <Input name="storeAddress" value={formData.storeAddress} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Regional</FormLabel>
                                <Select
                                    name="storeRegion"
                                    value={formData.storeRegion}
                                    onChange={(e, newValue) =>
                                        setFormData((prev) => ({ ...prev, storeRegion: newValue }))
                                    }
                                    required
                                >
                                    <Option value=""></Option>
                                    <Option value="Norte">Norte</Option>
                                    <Option value="Centro">Centro</Option>
                                    <Option value="Sul">Sul</Option>
                                    <Option value="Oeste">Oeste</Option>
                                </Select>
                            </FormControl>

                            <Typography level="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Contacto da Fiscalização</Typography>

                            <FormControl>
                                <FormLabel>Nome</FormLabel>
                                <Input name="storeInspectorName" value={formData.storeInspectorName} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Telefone</FormLabel>
                                <Input name="storeInspectorContact" type="tel" pattern="[0-9]{9}"
                                    value={formData.storeInspectorContact} onChange={handleChange} required />
                            </FormControl>

                            <Button variant="solid" color="primary" onClick={handleSubmit}>
                                Adicionar Loja
                            </Button>
                        </Sheet>
                    </main>
                </CssVarsProvider>
            </div>
        </>
    );
}