import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Typography } from '@mui/joy';
import Button from '@mui/joy/Button';
import Sheet from '@mui/joy/Sheet';
import { useAuth } from '../contexts/AuthContext.jsx';


export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

if (!user) return null;

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
                px: 3,
                py: 3,
                height: '5vh',
                boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.4)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: "100%",
                zIndex: 1100,

            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="/images/LOG.png" alt="LOG logo" style={{ display: "flex", maxHeight: "3.5rem", marginRight: "1rem" }} onClick={() => navigate('/Home')}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
                <Link to="/Home" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.3rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}
                >Lojas</Link>

                <Link to="/Completed" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.3rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Completas</Link>

                <Link to="/InProgress" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.3rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Em curso</Link>

                <Link to="/UpComming" style={{
                    color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.3rem', transition: '0.3s',
                }}
                    onMouseEnter={(e) => (e.target.style.color = '#212121')}
                    onMouseLeave={(e) => (e.target.style.color = '#fff')}>Próximas</Link>

                {[1, 2].includes(user.role) && (
                    <Link
                        to="/NewStore"
                        style={{
                            color: '#fff',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.3rem',
                            transition: '0.3s',
                        }}
                        onMouseEnter={(e) => (e.target.style.color = '#212121')}
                        onMouseLeave={(e) => (e.target.style.color = '#fff')}
                    >
                        Adicionar Loja
                    </Link>
                )}

                {[2].includes(user.role) && (
                    <Link
                        to="/Users"
                        style={{
                            color: '#fff',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.3rem',
                            transition: '0.3s',
                        }}
                        onMouseEnter={(e) => (e.target.style.color = '#212121')}
                        onMouseLeave={(e) => (e.target.style.color = '#fff')}
                    >
                        Utilizadores
                    </Link>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, marginRight: "3%" }}>
                <Typography level="body-md" sx={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                    Bem-vindo, {user.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button variant="soft" size="sm" style={{ minWidth: "6rem", fontSize: "12px" }} onClick={MyProfile}>Meu Perfil</Button>
                    <Button variant="solid" color="neutral" size="sm" style={{ minWidth: "6rem", fontSize: "12px" }} onClick={Logout}>Sair</Button>
                </Box>
            </Box>
        </Sheet>
    );
}
