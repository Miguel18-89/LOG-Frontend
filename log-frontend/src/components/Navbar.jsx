import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Box, Typography } from '@mui/joy';
import Button from '@mui/joy/Button';
import Sheet from '@mui/joy/Sheet';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/navbar.css';

export default function Navbar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);

    if (!user) return null;

    function Logout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }

    return (
        <Sheet className="navbar-sheet" variant="solid">

            {/* LOGO */}
            <Box className="navbar-logo">
                <img
                    className="navbar-logo-img"
                    src="/images/LOG.png"
                    alt="LOG logo"
                    onClick={() => navigate('/Home')}
                />
            </Box>

            {/* HAMBÚRGUER (mobile only) */}
            <div
                className="navbar-hamburger"
                onClick={() => setOpenMenu(!openMenu)}
            >
                ☰
            </div>

            {/* LINKS */}
            <Box className={`navbar-links ${openMenu ? "open" : ""}`}>
                <Link className="navbar-link" to="/Home">Lojas</Link>
                <Link className="navbar-link" to="/Completed">Completas</Link>
                <Link className="navbar-link" to="/InProgress">Em curso</Link>
                <Link className="navbar-link" to="/UpComming">Próximas</Link>

                {[1, 2].includes(user.role) && (
                    <Link className="navbar-link" to="/NewStore">Adicionar Loja</Link>
                )}

                {user.role === 2 && (
                    <Link className="navbar-link" to="/Users">Utilizadores</Link>
                )}
                
                {/* USER BOX MOBILE (só aparece no mobile) */}
                <div className="navbar-user-box-mobile">
                    <Typography level="body-md" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Bem-vindo, {user.name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Button
                            variant="soft"
                            size="sm"
                            onClick={() => navigate("/EditUser")}
                        >
                            Meu Perfil
                        </Button>

                        <Button
                            variant="solid"
                            color="neutral"
                            size="sm"
                            onClick={Logout}
                        >
                            Sair
                        </Button>
                    </Box>
                </div>

            </Box>

            {/* USER BOX */}
            <Box className="navbar-user-box">
                <Typography level="body-md"
                    sx={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                    Bem-vindo, {user.name}
                </Typography>

                <Box className="navbar-buttons">
                    <Button variant="soft" size="sm" className="navbar-button"
                        onClick={() => navigate("/EditUser")}>
                        Meu Perfil
                    </Button>

                    <Button variant="solid" color="neutral" size="sm" className="navbar-button"
                        onClick={Logout}>
                        Sair
                    </Button>
                </Box>
            </Box>

        </Sheet>
    );
}
