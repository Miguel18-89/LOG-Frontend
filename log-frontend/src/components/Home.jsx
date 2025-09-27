import { useNavigate} from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "/src/components/Navbar"




export default function Home() {
    const navigate = useNavigate();
    
    const getFlats = async () => {
        
    };


    useEffect(() => {
        getFlats();
    }, [])

    return (
        <>
            <Navbar></Navbar>
            
        </>
)

}

;