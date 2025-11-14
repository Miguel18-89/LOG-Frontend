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
import './components2.css';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'
import { toast } from 'react-toastify';
import '../styles/HomePage.css';

export default function NewStore() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const currentLoggedUser = JSON.parse(localStorage.getItem('user'));
    const [counter, setCounter] = useState(0)
    const [storeNameError, setStoreNameError] = useState("")
    const [validStoreName, setValidStoreName] = useState(false)
    const [storeNumberError, setStoreNumberError] = useState("")
    const [validStoreNumber, setValidStoreNumber] = useState(false)
    const [storeAddressError, setStoreAddressError] = useState("")
    const [validStoreAddress, setValidStoreAddress] = useState(false)
    const [storeRegionError, setStoreRegionError] = useState("")
    const [validStoreRegion, setValidStoreRegion] = useState(false)
    const [storeInspectorNameError, setStoreInspectorNameError] = useState("")
    const [validStoreInspectorName, setValidStoreInspectorName] = useState(false)
    const [storeInspectorContactError, setStoreInspectorContactError] = useState("")
    const [validStoreInspectorContact, setValidStoreInspectorContact] = useState(false)
    const [isValidData, setIsValidData] = useState()
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

    useEffect(() => {
        if (counter == 1) {
            if (!formData.storeName.trim() || formData.storeName.length < 3) {
                setStoreNameError("O nome da loja é obrigatório e deve conter 3 ou mais letras.");
                setValidStoreName(false)
            }
            else {
                setStoreNameError("");
                setValidStoreName(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeName, isValidData])

    useEffect(() => {
        if (counter == 1) {
            if (isNaN(formData.storeNumber) || Number(formData.storeNumber) <= 0) {
                setStoreNumberError("O número de loja é obrigatório.");
                setValidStoreNumber(false)
            }
            else {
                setStoreNumberError("");
                setValidStoreNumber(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeNumber, isValidData])

    useEffect(() => {
        if (counter == 1) {

            const isOnlyNumbers = /^\d+$/.test(formData.storeAddress);

            if (!formData.storeAddress.trim() || formData.storeAddress.length < 3 || isOnlyNumbers) {
                setStoreAddressError("A morada da Loja é obrigatória.");
                setValidStoreAddress(false)
            }
            else {
                setStoreAddressError("");
                setValidStoreAddress(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeAddress, isValidData])

    useEffect(() => {
        if (counter == 1) {

            if (!formData.storeRegion.trim()) {
                setStoreRegionError("A regional da loja é obrigatória");
                setValidStoreRegion(false)
            }
            else {
                setStoreRegionError("");
                setValidStoreRegion(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeRegion, isValidData])


    useEffect(() => {
        if (counter == 1) {

            if (!formData.storeInspectorName.trim() || formData.storeInspectorName.length < 3) {
                setStoreInspectorNameError("O nome do fiscal é obrigatório e deve conter 3 ou mais letras.");
                setValidStoreInspectorName(false)
            }
            else {
                setStoreInspectorNameError("");
                setValidStoreInspectorName(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeInspectorName, isValidData])

    useEffect(() => {
        if (counter == 1) {

            const contact = formData.storeInspectorContact.trim();

            const isValidMobile = /^9[1236]\d{7}$/.test(contact);

            if (!isValidMobile) {
                setStoreInspectorContactError("O contacto do fiscal deve ser um número de telemóvel válido.");
                setValidStoreInspectorContact(false);
            } 
            else {
                setStoreInspectorContactError("");
                setValidStoreInspectorContact(true);
            }
        }
        else {
            setCounter(1)
        }
    }, [formData.storeInspectorContact, isValidData])


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsValidData(true)
        if (validStoreName && validStoreNumber && validStoreAddress && validStoreRegion && validStoreInspectorName && validStoreInspectorContact) {
            try {
                await api.post('/stores', {
                    ...formData,
                    storeNumber: Number(formData.storeNumber),
                    storeInspectorContact: formData.storeInspectorContact ? Number(formData.storeInspectorContact) : null,
                    createdById: currentLoggedUser.id
                });
                toast.success("Loja adicionada com sucesso!");
                navigate("/Home");

            } catch (error) {
                if (error.response) {
                    toast.error("Erro ao adicionar a loja.");
                } else {
                    toast.error("Erro ao comunicar com o servidor.");
                }
            }
        }
        else {
            toast.error("Dados inválidos, verifique formulário.")
            setIsValidData(false)
            return;
        }
    };

    return (
        <>
            <div><Navbar></Navbar></div>
            <div>
                <CssVarsProvider>
                    <main className="store-container" >
                        <Sheet
                            sx={{
                                maxWidth: "100%",
                                mx: 'auto',
                                py: 3,
                                px: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0,
                                borderRadius: 'sm',
                                boxShadow: 'lg',
                                backgroundColor: '#fff',
                            }}
                            variant="outlined"
                        >
                            <Typography level="h4" component="h1" sx={{ fontWeight: 'bold', color: '#f57c00', textAlign: 'center', }}>
                                Adicionar Nova Loja
                            </Typography>

                            <FormControl>
                                <FormLabel>Nome da Loja</FormLabel>
                                <Input name="storeName" size= "sm" value={formData.storeName} onChange={handleChange} required />
                                <p style={{ color: "red", fontSize: "12px" }}>{storeNameError}</p>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Número (PT)</FormLabel>
                                <Input name="storeNumber" size= "sm"
                                    value={formData.storeNumber} onChange={handleChange} required />
                                <p style={{ color: "red", fontSize: "12px" }}>{storeNumberError}</p>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Morada</FormLabel>
                                <Input name="storeAddress" size= "sm" value={formData.storeAddress} onChange={handleChange} required />
                                <p style={{ color: "red", fontSize: "12px" }}>{storeAddressError}</p>
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
                                <p style={{ color: "red", fontSize: "12px" }}>{storeRegionError}</p>
                            </FormControl>

                            <Typography level="h5" sx={{ mt: 2, fontWeight: 'bold', textAlign: "center" }}>Dados da Fiscalização</Typography>

                            <FormControl>
                                <FormLabel>Nome</FormLabel>
                                <Input name="storeInspectorName" size= "sm" value={formData.storeInspectorName} onChange={handleChange} required />
                                <p style={{ color: "red", fontSize: "12px" }}>{storeInspectorNameError}</p>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Telefone</FormLabel>
                                <Input name="storeInspectorContact" type="tel" pattern="[0-9]{9}" size= "sm"
                                    value={formData.storeInspectorContact} onChange={handleChange} required />
                                <p style={{ color: "red", fontSize: "12px" }}>{storeInspectorContactError}</p>
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