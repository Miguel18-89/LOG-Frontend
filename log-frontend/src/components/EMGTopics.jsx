import { Link, useLocation } from "react-router-dom";
import { FaTools, FaTruck, FaUsers, FaClock } from "react-icons/fa";
import "../styles/emg-navbar.css";

const items = [
    { label: "Assistência técnica", icon: <FaTools />, to: "/EMG/Assistencia" },
    { label: "Frota", icon: <FaTruck />, to: "/EMG/Frota" },
    { label: "Pessoal", icon: <FaUsers />, to: "/EMG/Pessoal" },
    { label: "Horas Extra", icon: <FaClock />, to: "/EMG/HorasExtra" },
];

export default function EMGNavbar() {
    const location = useLocation();

    return (
        <div className="emg-navbar">
            {items.map((item, index) => (
                <Link
                    key={index}
                    to={item.to}
                    className={`emg-navbar-item ${location.pathname === item.to ? "active" : ""}`}
                >
                    <span className="emg-navbar-icon">{item.icon}</span>
                    <span className="emg-navbar-label">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}