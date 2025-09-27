import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Typography } from '@mui/joy';
import Button from '@mui/joy/Button';
import Avatar from '@mui/joy/Avatar';
import Sheet from '@mui/joy/Sheet';

export default function Navbar() {
    const navigate = useNavigate();
    const [currentLoggedUser, setCurrentLoggedUser] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, []);

    function Logout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }

    function MyProfile() {
        navigate("/EditUser");
    }

    return (
        <Sheet
            variant="solid"
            sx={{
                background: 'linear-gradient(90deg, #ffb74d 0%, #f57c00 50%, #fb8c00 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 3,
                height: '100px',
                boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.4)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: "97%",
                zIndex: 1100,

            }}
        >
            {/* Logo e título */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="/src/images/LOG.png" alt="LOG logo" style={{ height: "60px", marginRight: "1rem" }} />
            </Box>

            {/* Links de navegação */}
            <Box sx={{ display: 'flex', gap: 3 }}>
                <Link to="/Home" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}
                >Lojas</Link>

                <Link to="/Completed" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Completas</Link>

                <Link to="/InProgress" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Em progresso</Link>

                <Link to="/Upcoming" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Próximas</Link>

                <Link to="/NewStore" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Adicionar Loja</Link>

                <Link to="/Users" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.7rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Utilizadores</Link>
            </Box>

            {/* Perfil e ações */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Typography level="body-md" sx={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Bem-vindo, {currentLoggedUser.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="soft" onClick={MyProfile}>Meu Perfil</Button>
                    <Button variant="solid" color="neutral" style={{minWidth: "7rem"}} onClick={Logout}>Sair</Button>
                </Box>
            </Box>
        </Sheet>
    );
}














/*import { useNavigate, Link } from "react-router-dom";
import Button from '@mui/joy/Button';
import { use, useEffect, useState } from "react";
import './components.css'


export default function Navbar() {


    const navigate = useNavigate();
    const [currentLoggedUser, setCurrentLoggedUser] = useState([])



    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, []);


    function Logout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');

    }
    function MyProfile() {
        navigate("/EditUser")
    }

    return (
        <div id="navbarDiv">
            <div id="imgNavbarDiv">
                <img src="/src/images/LOG.png" alt="LOG logo" style={{height: "60%"}}/>
            </div>
            <div id="navbarCenter">
                <div id="navbarLinksDiv">
                    <Link to="/Home" id="navbarLink" >Home</Link>
                    <Link to="/components/MyFlats" id="navbarLink">My Flats</Link>
                    <Link to="/components/Favorites" id="navbarLink">Favorite Flats</Link>
                </div>
            </div>
            <div id="navbarProfileDiv">
                <div >
                    <div id="userIdDiv">
                        <h3>Welcome {currentLoggedUser.name}</h3>
                    </div>
                    <div>
                        <Button size="lg" variant="plain" onClick={MyProfile}>My Profile</Button>
                        <Button size="lg" color="danger" variant="solid" onClick={Logout}>Logout</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}*/