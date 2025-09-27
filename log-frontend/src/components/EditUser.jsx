import Navbar from './Navbar';
import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./components.css"
import api from '../services/api'

export default function EditUser({ props }) {

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [validName, setValidName] = useState(true);
    const navigate = useNavigate();
    const [counter, setCounter] = useState(0);
    const [editUser, setEditUser] = useState([])
    const [user, setUser] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setEmail(parsedUser.email);
        }
    }, []);


    const updateUser = async () => {
        console.log(name)
        try {
            const updatedUser = {

                name: name === "" ? user.name : name,
            };

            await api.put(`/users/${user.id}`, updatedUser);

            const newUser = {
                ...user,
                name: updatedUser.name
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));


            console.log("Utilizador atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar utilizador:", error);
        }
    };

    useEffect(() => {
        if (counter == 1) {
            if (name.length < 2) {
                setNameError("The first name should have at least 2 letters")
                setName(false)
            }
            else {
                setNameError("");
                setNameError(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [name])


    function handleSubmit(e) {
        e.preventDefault();
        if (validName == true) {
            updateUser();
            alert("Profile update successfully.")
            navigate("/Home")
        }
        else {
            alert("Invalid data, please check.");
        }
    }


    const ResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        console.log(email)
        try {
            const response = await api.post('/users/forgot-password', { email });
            setMessage('Email enviado com sucesso! Verifica a tua caixa de entrada.');
        } catch (err) {
            setError('Erro ao enviar email.');
        }
    };



    return (
        <>
            <div><Navbar></Navbar></div>
            <div id='editUsersDiv'>
                <main id='form'>
                    <CssVarsProvider {...props}>
                        <Sheet
                            sx={{
                                width: 700,
                                mx: 'auto', // margin left & right
                                my: 4, // margin top & bottom
                                py: 3, // padding top & bottom
                                px: 2, // padding left & right
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                borderRadius: 'sm',
                                boxShadow: 'md',
                            }}
                            variant="outlined"
                        >
                            <div>
                                <Typography style={{ fontWeight: "normal" }} level="h4" component="h1">
                                    <b>My Profile</b>
                                </Typography>
                            </div>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input name="email" type="email" value={user.email} disabled />
                                <p style={{ color: "red", fontSize: "12px" }}></p>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Name</FormLabel>
                                <Input name="name" type="text" defaultValue={user.name} onChange={e => setName(e.target.value)} />
                                <p style={{ color: "red", fontSize: "12px" }}>{nameError}</p>
                            </FormControl>

                            <Button sx={{ mt: 1 /* margin top */ }} onClick={handleSubmit}>Update profile</Button>
                            <br />
                            <Button sx={{ mt: 1 /* margin top */ }} onClick={ResetPassword}>Reset Password</Button>

                            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

                        </Sheet>
                    </CssVarsProvider>
                </main>
            </div>
        </>

    );
}