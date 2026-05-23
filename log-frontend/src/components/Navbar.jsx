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
            <div className="navbar-hamburger" onClick={() => setOpenMenu(!openMenu)}>
                ☰
            </div>

            {/* LINKS */}
            <Box className={`navbar-links ${openMenu ? 'open' : ''}`}>
                <Link className="navbar-link" to="/EMG/Assistencia" onClick={() => setOpenMenu(false)}>Assistência Técnica</Link>
                <Link className="navbar-link" to="/EMG/Frota" onClick={() => setOpenMenu(false)}>Frota</Link>
                <Link className="navbar-link" to="/EMG/Pessoal" onClick={() => setOpenMenu(false)}>Pessoal</Link>
                <Link className="navbar-link" to="/EMG/Ferias" onClick={() => setOpenMenu(false)}>Férias</Link>
                <Link className="navbar-link" to="/EMG/HorasExtra" onClick={() => setOpenMenu(false)}>Horas Extra</Link>

                {user.role === 2 && (
                    <Link className="navbar-link" to="/Users" onClick={() => setOpenMenu(false)}>Utilizadores</Link>
                )}

                {/* USER BOX MOBILE */}
                <div className="navbar-user-box-mobile">
                    <Typography level="body-md" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Bem-vindo, {user.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Button variant="soft" size="sm" onClick={() => { navigate('/EditUser'); setOpenMenu(false); }}>
                            Meu Perfil
                        </Button>
                        <Button variant="solid" color="neutral" size="sm" onClick={Logout}>
                            Sair
                        </Button>
                    </Box>
                </div>
            </Box>

            {/* USER BOX DESKTOP */}
            <Box className="navbar-user-box">
                <Typography level="body-md" sx={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                    Bem-vindo, {user.name}
                </Typography>
                <Box className="navbar-buttons">
                    <Button variant="soft" size="sm" className="navbar-button" onClick={() => navigate('/EditUser')}>
                        Meu Perfil
                    </Button>
                    <Button variant="solid" color="neutral" size="sm" className="navbar-button" onClick={Logout}>
                        Sair
                    </Button>
                </Box>
            </Box>

        </Sheet>
    );
}
