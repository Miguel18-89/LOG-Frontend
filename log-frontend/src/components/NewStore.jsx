import { useState } from 'react';
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
    const [formData, setFormData] = useState({
        nome: '',
        numero: '',
        morada: '',
        regional: '',
        area: '',
        fiscalizacaoNome: '',
        fiscalizacaoTelefone: '',
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const errors = [];

        // Validação de campos obrigatórios
        if (!formData.nome.trim()) {
            errors.push("O campo Nome é obrigatório.");
        }

        if (!formData.numero.trim()) {
            errors.push("O campo Número da Loja é obrigatório.");
        }

        // Verificar se número da loja é um número válido
        if (isNaN(formData.numero) || Number(formData.numero) <= 0) {
            errors.push("O Número da Loja deve ser um número válido.");
        }

        // Verificar se área é um número válido
        if (formData.area == "") {
        }
        else {

            if (Number(formData.area) <= 0 || (!Number(formData.area))) {
                errors.push("A Área deve ser um número válido.");
            }
        }


        // Verificar se telefone é um número válido (opcional: 9 dígitos)
        if (formData.fiscalizacaoTelefone == "") {
        }
        else {
            if (isNaN(formData.fiscalizacaoTelefone) || formData.fiscalizacaoTelefone.length < 9) {
                errors.push("O telefone da fiscalização deve conter apenas números e ter pelo menos 9 dígitos.");
            }
        }

        if (errors.length > 0) {
            alert("Erros no formulário:\n\n" + errors.join("\n"));
            return;
        }

        // Se tudo estiver válido
        console.log("Nova loja:", formData);
        alert("Loja adicionada com sucesso!");
        navigate("/Home")
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

                            {/* Dados da loja */}
                            <FormControl>
                                <FormLabel>Nome da Loja</FormLabel>
                                <Input name="nome" value={formData.nome} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Número</FormLabel>
                                <Input name="numero"
                                    value={formData.numero} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Morada</FormLabel>
                                <Input name="morada" value={formData.morada} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Regional</FormLabel>
                                <Select
                                    name="regional"
                                    value={formData.regional}
                                    onChange={(e, newValue) =>
                                        setFormData((prev) => ({ ...prev, regional: newValue }))
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

                            <FormControl>
                                <FormLabel>Área (m2)</FormLabel>
                                <Input name="area"
                                    value={formData.area} onChange={handleChange} required />
                            </FormControl>

                            {/* Fiscalização */}
                            <Typography level="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Contacto da Fiscalização</Typography>

                            <FormControl>
                                <FormLabel>Nome</FormLabel>
                                <Input name="fiscalizacaoNome" value={formData.fiscalizacaoNome} onChange={handleChange} required />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Telefone</FormLabel>
                                <Input name="fiscalizacaoTelefone" type="tel" pattern="[0-9]{9}"
                                    value={formData.fiscalizacaoTelefone} onChange={handleChange} required />
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