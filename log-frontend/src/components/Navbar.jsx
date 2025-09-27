import { useNavigate, Link } from "react-router-dom";
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
}