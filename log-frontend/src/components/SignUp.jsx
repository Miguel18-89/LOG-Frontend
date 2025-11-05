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
import { toast } from 'react-toastify';



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

        if (validEmail && validPassword && validPasswordConfirmation && validUserName) {
            setCounter(0);

            const userData = {
                name: userName,
                email: userEmail,
                password: password
            };

            const createUserPromise = api.post('/users', userData);

            toast.promise(createUserPromise, {
                pending: 'A criar utilizador...',
                success: 'Utilizador criado com sucesso. Aguarda aprovação do administrador.',
                error: {
                    render({ data }) {
                        const msg = data?.response?.data?.message || 'Erro ao criar utilizador.';
                        return typeof msg === 'string' ? msg : JSON.stringify(msg);
                    }
                }
            });

            try {
                const response = await createUserPromise;
                if (response.status === 201) {
                }
                setUserEmail("");
                setPassword("");
                setPasswordConfirmation("");
                setUserName("");
                navigate("/");
            } catch (error) {
                console.error("Erro ao criar utilizador:", error);
            }
        } else {
            toast.error("Dados inválidos.");
        }
    }

    function closePage() {
        navigate("/")
    }x

    return (
        <>
            <div id='containerLogin' style={{ maxHeight: "100vh" }}>
                <div id='imageDiv'>
                    <img src="/src/images/LOG.png" alt="LOG Logo" />
                </div>
                <main id='form'>
                    <CssVarsProvider >
                        <CssBaseline />
                        <Sheet
                            sx={{
                                width: 700,
                                mx: 'auto',
                                my: 4,
                                py: 3,
                                px: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                borderRadius: 'sm',
                                boxShadow: 'md',
                            }}
                            variant="outlined"
                        >
                            <div>
                                <Typography style={{ fontWeight: 'bold', color: '#f57c00' }} level="h4" component="h1">
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
        </>
    );
}