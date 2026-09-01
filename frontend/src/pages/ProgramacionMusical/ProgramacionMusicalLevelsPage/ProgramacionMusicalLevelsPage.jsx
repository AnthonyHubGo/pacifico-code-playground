import React, { useEffect, useMemo } from "react";
import './ProgramacionMusicalLevelsPage.scss';
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchLevelsMap } from "../../../redux/slices/musicSlice";
import ProgramacionMusicalLevelButton from "../../../components/ProgramacionMusical/ProgramacionMusicalLevelButton/ProgramacionMusicalLevelButton";
import HeaderNavbar from '../../../components/header/HeaderNavbar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleLeft, faLock } from "@fortawesome/free-solid-svg-icons";

export default function ProgramacionMusicalLevelsPage() {
    const regionId = useParams();
    const region = { id: 1, name: 'Pacifico', description: 'Descripción de la Región Pacifico.', isUnlocked: true };
    const dispatch = useDispatch();
    const levelsMap = useSelector((state) => state.music.levelsMap);
    const userId = useSelector((state) => state.auth.user.id);
    const navigate = useNavigate();

    console.log("Levels Map from Redux:", levelsMap);

    const colorClasses = [
        "color-galactic-blue",
        "color-cosmic-violet",
        "color-sun-yellow",
        "color-brilliant-turquoise"
    ];

    // Solo se recalcula cuando cambia el array de niveles
    const levelColors = useMemo(() => {
        const shuffled = [...colorClasses].sort(() => Math.random() - 0.5);
        return levelsMap.map((_, idx) => shuffled[idx % shuffled.length]);
    }, [levelsMap]);

    useEffect(() => {
        dispatch(fetchLevelsMap(userId));
    }, [dispatch]);

    return(
        <>
            <HeaderNavbar />
            <section className="programacion-musical-title">
                <FontAwesomeIcon
                    icon={faArrowAltCircleLeft}
                    onClick={() => navigate("/programacion-musical")}
                />
                <h1>Pacifico Code</h1>
            </section>

            <section className="robot-logic-levels-container">
                {levelsMap.map((level, index) => (
                    <ProgramacionMusicalLevelButton
                        key={level.id}
                        region={region}
                        level={level}
                        colorClass={levelColors[index]}
                    />
                ))}
            </section>
        </>
    );
}