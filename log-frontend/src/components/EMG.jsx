import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function EMG() {
    return (
        <>
            <Navbar />
            <div style={{ padding: '0 1rem 2rem', marginTop: 'calc(2vh + 0.5rem)' }}>
                <Outlet />
            </div>
        </>
    );
}