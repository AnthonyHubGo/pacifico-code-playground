import React from "react";
import COSMO_SWIMSUIT_WAVING from '../../../assets/pet/ProgramacionMusical/COSMO_SWIMSUIT_WAVING.png';
import './RegionCard.scss';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

export default function RegionCard({ region }) {
    const navigate = useNavigate();

    const petImages = {
        pacifico: COSMO_SWIMSUIT_WAVING,
        andina: COSMO_SWIMSUIT_WAVING,
        caribe: COSMO_SWIMSUIT_WAVING,
    };

    function handleClick() {
        if (region.isUnlocked) {
            navigate(`/programacion-musical/${region.id}/levels`);
        }
    }

    const regionImage = petImages[region.name?.toLowerCase()];

    return (
        <button className="region-card" disabled={!region.isUnlocked} onClick={handleClick}>
            <img src={regionImage}/>
            <div className="region-card-text">
                <h2>{region.name}</h2>
                <p>{region.description}</p>
            </div>
            {!region.isUnlocked && (
                <FontAwesomeIcon icon={faLock} className="lock-icon" />
            )}
        </button>
    );
}