import { CssVarsProvider, } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'



export default function SignUp({ props }) {

    const [userEmail, setUserEmail] = useState("");
    const [userEmailError, setUserEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [passwordConfirmationError, setPasswordConfirmationError] = useState("");
    const [userName, setUserName] = useState("");
    const [userNameError, setUserNameError] = useState("");
    const [validEmail, setValidEmail] = useState();
    const [validPassword, setValidPassword] = useState();
    const [validPasswordConfirmation, setValidPasswordConfirmation] = useState();
    const [validUserName, setValidFirstName] = useState();
    const navigate = useNavigate();
    const [counter, setCounter] = useState(0);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (counter == 1) {
            setUserEmailError("");
            let checkemail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!userEmail) {
                setUserEmailError("Por favor introduzir um endereço de email válido.")
                setValidEmail(false)
            }
            else if (checkemail.test(userEmail) == false) {
                setUserEmailError("Por favor introduzir um endereço de email válido.")
                setValidEmail(false)
            }
            else {
                setValidEmail(true)
            }
        }
        else {
            setCounter(1)
            setValidEmail(true)
        }
    }, [userEmail])

    useEffect(() => {
        if (counter == 1) {
            let checkPassword = /^(?=.*[a-z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{6,100}$/;
            if (checkPassword.test(password) == false) {
                setPasswordError("A password deve conter pelo menos 6 caracteres, letras, números e um caracter especial.")
                setValidPassword(false)
            }
            else {
                setPasswordError("");
                setValidPassword(true)
            }
            if (password != passwordConfirmation) {
                setPasswordConfirmationError("As passwords não coincidem.")
                setValidPasswordConfirmation(false)
            }
            else {
                setPasswordConfirmationError("");
                setValidPasswordConfirmation(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [password, passwordConfirmation])

    useEffect(() => {
        if (counter == 1) {
            if (userName.length < 2) {
                setUserNameError("O nome deve conter no minimo 2 letras.")
                setValidFirstName(false)
            }
            else {
                setUserNameError("");
                setValidFirstName(true)
            }
        }
        else {
            setCounter(1)
        }
    }, [userName])


    async function handleSubmit(e) {
        e.preventDefault();
        if (validEmail == true && validPassword == true && validPasswordConfirmation == true && validUserName == true) {
            setCounter(0)
            await api.post('/users', {
                name: userName,
                email: userEmail,
                password: password
            }).then(response => {
                alert(JSON.stringify(response?.data));
                setUserEmail("")
                setPassword("")
                setPasswordConfirmation("")
                setUserName("")
                navigate("/")
            })
                .catch(error => {
                    alert(JSON.stringify(error.response?.data));
                    setUserEmail("")
                    setPassword("")
                    setPasswordConfirmation("")
                    setUserName("")
                    
                });
        }
        else {
            alert("Dados inválidos.");
        }
    }

    function closePage() {
        navigate("/")
    }

    return (
        <div id='containerLogin'>
            <div id='imageDiv'>
                <img src="/src/images/LOG.png" alt="LOG Logo" />
            </div>

            <div id='verticalSeparatorDiv'>
            </div>

            <main id='form'>

                <CssVarsProvider {...props}>
                    <CssBaseline />
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
                            <Typography style={{fontWeight: 'bold', color: '#f57c00' }}level="h4" component="h1">
                                <b>Novo utilizador</b>
                            </Typography>
                            <Typography level="body-sm">Preencha todos os campos para criar um novo utilizador.</Typography>
                        </div>

                        <FormControl>
                            <FormLabel>Nome</FormLabel>
                            <Input name="name" type="text" value={userName} onChange={e => setUserName(e.target.value)} />
                            <p style={{ color: "red", fontSize: "12px" }}>{userNameError}</p>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input name="email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value.toLowerCase())} />
                            <p style={{ color: "red", fontSize: "12px" }}>{userEmailError}</p>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Password</FormLabel>
                            <Input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            <p style={{ color: "red", fontSize: "12px", width: "90%" }}>{passwordError}</p>
                        </FormControl>

                        <FormControl>
                            <FormLabel >Confirmação de Password</FormLabel>
                            <Input name="password" type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} />
                            <p style={{ color: "red", fontSize: "12px" }}>{passwordConfirmationError}</p>
                        </FormControl>

                        <Button sx={{ mt: 1 /* margin top */ }} onClick={handleSubmit}>Registar</Button>
                        <Button sx={{ mt: 1 /* margin top */ }} onClick={closePage}>Voltar</Button>
                    </Sheet>
                </CssVarsProvider>

            </main>
        </div>
    );
}