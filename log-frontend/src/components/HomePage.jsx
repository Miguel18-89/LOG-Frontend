import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { FaTools, FaTruck, FaUsers, FaClock, FaCalendarAlt } from 'react-icons/fa';

const SECTIONS = [
    { label: 'Assistência Técnica', icon: FaTools,        to: '/EMG/Assistencia' },
    { label: 'Frota',               icon: FaTruck,        to: '/EMG/Frota'       },
    { label: 'Pessoal',             icon: FaUsers,        to: '/EMG/Pessoal'     },
    { label: 'Férias',              icon: FaCalendarAlt,  to: '/EMG/Ferias'      },
    { label: 'Horas Extra',         icon: FaClock,        to: '/EMG/HorasExtra'  },
];

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    bgcolor: '#fff',
                    p: 3,
                    pt: 'calc(8vh + 3rem)',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                        gap: 3,
                        maxWidth: 900,
                        width: '100%',
                    }}
                >
                    {SECTIONS.map(({ label, icon: Icon, to }) => (
                        <Box
                            key={to}
                            onClick={() => navigate(to)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                p: { xs: 3, md: 6 },
                                borderRadius: 'xl',
                                bgcolor: '#fff',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                cursor: 'pointer',
                                border: '2px solid transparent',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: '#f57c00',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                                    transform: 'translateY(-4px)',
                                },
                            }}
                        >
                            <Icon style={{ fontSize: '4rem', color: '#f57c00' }} />
                            <Typography
                                level="title-md"
                                sx={{ fontWeight: 'bold', color: '#444', textAlign: 'center' }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </>
    );
}
