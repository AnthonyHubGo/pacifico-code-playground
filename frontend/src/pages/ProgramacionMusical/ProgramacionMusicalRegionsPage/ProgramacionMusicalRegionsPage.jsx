import React from "react";
import RegionCard from '../../../components/ProgramacionMusical/RegionCard/RegionCard';
import './ProgramacionMusicalRegionsPage.scss';
import HeaderNavbar from "../../../components/header/HeaderNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function ProgramacionMusicalRegionsPage() {
    const navigate = useNavigate();
    const regions = [
        { id: 1, name: 'Pacifico', description: 'Descripción de la Región Pacifico.', isUnlocked: true },
        { id: 2, name: 'Andina', description: 'Descripción de la Región Andina.', isUnlocked: false },
        { id: 3, name: 'Caribe', description: 'Descripción de la Región Caribe.', isUnlocked: false }
    ];

    return (
        <>
            <HeaderNavbar />
            <div className="programacion-musical-regions-page">
                <section className="regions-page-title">
                    <FontAwesomeIcon
                        icon={faArrowAltCircleLeft}
                        onClick={() => navigate("/eduverso-home-page")}
                    />
                    <div><h1>Programación Musical</h1></div>
                </section>
                
                {regions.map(region => (
                    <RegionCard key={region.id} region={region} />
                ))}
            </div>
        </>
    );
}