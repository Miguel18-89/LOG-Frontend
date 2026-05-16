import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import EMGNavbar from './EMGTopics';

export default function EMG() {
    return (
        <>
            <Navbar />
            <div style={{ padding: '0 1rem 2rem' }}>
                <EMGNavbar />
                <Outlet />
            </div>
        </>
    );
}