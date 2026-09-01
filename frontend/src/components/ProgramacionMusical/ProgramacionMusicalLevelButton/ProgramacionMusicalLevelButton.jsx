import React from "react";
import './ProgramacionMusicalLevelButton.scss';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

export default function ProgramacionMusicalLevelButton({ region, level, colorClass }) {
    const navigate = useNavigate();

    function handleClick() {
        if(level.isUnlocked){
            // navigate(`/programacion-musical/playground/${region.id}/${level.id}`);
            navigate(`/programacion-musical/playground/${level.id}`);
        }
    }

    return(
        <button
            className={`programacion-musical-level-button ${colorClass} ${!level.isUnlocked ? "locked" : ""}`}
            disabled={!level.isUnlocked}
            onClick={handleClick}
        >
            <span className="level-number">{level.number}</span>
            {!level.isUnlocked && (
                <FontAwesomeIcon icon={faLock} className="lock-icon" />
            )}
        </button>
    );
}