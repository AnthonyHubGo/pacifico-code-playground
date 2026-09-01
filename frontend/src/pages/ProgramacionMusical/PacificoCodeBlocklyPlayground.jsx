import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import { javascriptGenerator } from "blockly/javascript";

import initIfGenerator from "../../blockly/generators/core/condicionales";
import initLoopsGenerator from "../../blockly/generators/core/CiclosMusica";
import initStartBlock from "../../blockly/generators/core/start_block";
import initSoundGenerator from "../../blockly/generators/core/sonido";
import initFunctionsGenerator from "../../blockly/generators/core/funciones";
import initMusicIfGenerator from "../../blockly/generators/core/condicionalesMusica";

import HeaderNavbar from "../../components/header/HeaderNavbar";
import "./PacificoCodeBlocklyPlayground.scss";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchLevelInit, saveProgress, fetchLevelsMap } from "../../redux/slices/musicSlice";
import { validateMusicCode } from "../../utils/validateMusicCode";

// Iconos / imágenes
import marimbaIcon from "../../assets/Icons/instruments/marimba.svg";
import guasaIcon from "../../assets/Icons/instruments/guasa.svg";
import tamboraIcon from "../../assets/Icons/instruments/tambora.svg";
import cununoIcon from "../../assets/Icons/instruments/cununo.svg";
import { useNavigate, useParams } from "react-router-dom";

export default function BlocklyDemo() {
  const { levelId } = useParams();
  const navigate = useNavigate();

  const workspaceRef = useRef(null);
  const workspaceInstance = useRef(null);
  const playingRef = useRef({ audios: new Set(), instruments: new Set() }); // 🎧 Estado global

  const dispatch = useDispatch();
  const currentLevel = useSelector((state) => state.music.currentLevel);
  const levelsMap = useSelector((state) => state.music.levelsMap);
  const userId = useSelector((state) => state.auth.user?.id || 1);
  const token = useSelector((state) => state.auth.token);

  const [isSaving, setIsSaving] = useState(false);

  // ----------------------------
  // 🔊 Sistema global de sonido
  // ----------------------------
  function playSound(src) {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      playingRef.current.audios.add(audio);

      const baseName = src.split("/").pop().replace(".wav", "").toLowerCase();
      playingRef.current.instruments.add(baseName);

      audio.onended = () => {
        playingRef.current.instruments.delete(baseName);
        playingRef.current.audios.delete(audio);
        resolve();
      };

      audio.play();
    });
  }

  function isPlaying(name) {
    return playingRef.current.instruments.has(String(name).toLowerCase());
  }

  function stopAll() {
    for (const a of Array.from(playingRef.current.audios)) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch { }
    }
    playingRef.current.audios.clear();
    playingRef.current.instruments.clear();
  }

  // ----------------------------
  // Inicialización y Redux
  // ----------------------------
  // Inicializa el nivel que viene en la URL (levelId). Si no hay levelId, usa level 1.
  useEffect(() => {
    if (!userId || !token) return;
    const id = levelId ? parseInt(levelId, 10) : 1;
    if (!Number.isNaN(id)) {
      dispatch(fetchLevelInit(id));
    } else {
      dispatch(fetchLevelInit(1));
    }
    dispatch(fetchLevelsMap(userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userId, token, levelId]);

  // Refresca el mapa de niveles cuando cambia el usuario/token
  useEffect(() => {
    if (userId && token) dispatch(fetchLevelsMap(userId));
  }, [userId, token, dispatch]);

  // ▶ Reproducir
  const handlePlay = async () => {
    if (!workspaceInstance.current || isSaving) return;
    const workspace = workspaceInstance.current;

    javascriptGenerator.init(workspace);

    // 1. Definiciones de funciones
    const allDefs = [];
    workspace.getAllBlocks(false).forEach((block) => {
      if (block.type === "procedures_defnoreturn") {
        const defCode = javascriptGenerator.blockToCode(block);
        if (defCode) allDefs.push(defCode);
      }
    });

    // 2. Buscar bloque de inicio
    const topBlocks = workspace.getTopBlocks(true);
    const startBlock = topBlocks.find((b) => b.type === "music_start_block");
    if (!startBlock) {
      console.warn("No se encontró el bloque de inicio (start_block).");
      return;
    }

    // 3. Generar mainCode
    const mainCode = javascriptGenerator.blockToCode(startBlock);

    // 4. Concatenar todo el código
    const code = `${allDefs.join("\n")}\n${mainCode}`;
    console.log("Ejecutando código:\n", code);

    // 5. Validación con reglas
    const rulesForValidation = {
      ...currentLevel?.rules,
      instruments:
        Array.isArray(currentLevel?.rules?.instruments) && currentLevel.rules.instruments.length
          ? currentLevel.rules.instruments
          : Array.isArray(currentLevel?.instruments)
            ? currentLevel.instruments
            : [],
    };

    const isValid = validateMusicCode(code, rulesForValidation);

    // Preparamos la función ejecutable (la reutilizaremos)
    const makeAsyncExecution = (srcCode) =>
      new Function("playSound", "isPlaying", `return (async () => { ${srcCode} })();`);

    if (isValid && currentLevel) {
      setIsSaving(true); // bloqueamos UI mientras reproducimos y guardamos
      try {
        // 1) Ejecutar el código para que suenen los instrumentos ANTES del alert
        try {
          const exec = makeAsyncExecution(code);
          await exec(playSound, isPlaying);
        } catch (err) {
          // Si la ejecución falla, avisamos pero no impedimos el guardado/navegación
          console.error("Error ejecutando código antes del guardado:", err);
          // Podemos avisar al usuario que hubo un problema al sonar, pero continuar:
          window.alert("Ocurrió un error al reproducir los sonidos. Se intentará guardar el progreso igualmente.");
        }

        // 2) Guardar progreso (marca como completado)
        await dispatch(
          saveProgress({
            userId,
            levelId: currentLevel.id,
            isCompleted: true,
            lastSavedWorkspace: Blockly.serialization.workspaces.save(workspace),
          })
        );

        // 3) Refrescar mapa de niveles (intentamos obtener payload si el thunk lo devuelve)
        let updatedLevels = levelsMap;
        try {
          const res = await dispatch(fetchLevelsMap(userId));
          if (res && res.payload) updatedLevels = res.payload;
        } catch (err) {
          console.warn("fetchLevelsMap no devolvió payload, usando levelsMap existente", err);
        }

        // 4) Mostrar alert y, después de que el usuario haga click en OK, navegar al siguiente nivel (si existe)
        // window.alert es síncrono; la navegación se hace después de que el usuario cierre el diálogo
        window.alert("¡Nivel completado! 🎉");

        // Determinar siguiente nivel en la lista actualizada
        const index = Array.isArray(updatedLevels) ? updatedLevels.findIndex((l) => l.id === currentLevel.id) : -1;
        if (index !== -1 && index + 1 < updatedLevels.length) {
          const next = updatedLevels[index + 1];
          navigate(`/programacion-musical/playground/${next.id}`);
          return;
        }
        // Si no hay siguiente nivel, ya mostramos la alerta y no navegamos
      } catch (err) {
        console.error("Error guardando progreso o navegando:", err);
        window.alert("Ocurrió un error guardando el progreso.");
      } finally {
        setIsSaving(false);
      }
    } else {
      window.alert("El código no cumple con las reglas del nivel ❌");
    }

    // Nota: ya ejecutamos (o intentamos ejecutar) el código antes del alert si era válido.
    // No necesitamos ejecutar de nuevo aquí.
  };

  // ■ Detener
  const handleStop = () => {
    stopAll();
  };

  // ----------------------------
  // Inicializar Blockly
  // ----------------------------
  useEffect(() => {
    if (!workspaceRef.current) return;

    const toolbox = {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: "Tocar Instrumento",
          colour: "#4D2AA6",
          contents: [
            { kind: "block", type: "music_start_block" },
          ],
        },
        {
          kind: "category",
          name: "Condicionales",
          colour: "#A275F7",
          contents: [
            { kind: "block", type: "music_if_condition" },
          ],
        },
        {
          kind: "category",
          name: "Ciclos",
          colour: "#00C9A7",
          contents: [
            { kind: "block", type: "controls_repeat_ext" },
          ],
        },
        {
          kind: "category",
          name: "Funciones",
          colour: "#FF5DA2",
          contents: [
            { kind: "block", type: "procedures_callnoreturn" },
            { kind: "block", type: "procedures_defnoreturn" },
          ],
        },
        {
          kind: "category",
          name: "Números",
          colour: "#4FC3F7",
          contents: [
            { kind: "block", type: "math_number" },
          ],
        },
        {
          kind: "category",
          name: "Instrumentos",
          colour: "#FFB300",
          contents: [
            { kind: "block", type: "play_sound" },
          ],
        },
      ],
    };


    const eduversoTheme = Blockly.Theme.defineTheme("eduverso", {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: "#303555ff",
        toolboxBackgroundColour: "#FBD45D",
        toolboxForegroundColour: "#1D1E26",
        flyoutBackgroundColour: "#F5F7FA",
        flyoutForegroundColour: "#1D1E26",
      },
    });

    const workspace = Blockly.inject(workspaceRef.current, {
      toolbox,
      theme: eduversoTheme,
      trashcan: true,
      zoom: { controls: true, wheel: true },
      toolboxPosition: "start",
    });

    try {
      initLoopsGenerator();
      initSoundGenerator();
      initIfGenerator();
      initMusicIfGenerator();
      initStartBlock("music", "reproducir");
      initFunctionsGenerator();
    } catch (err) {
      console.error("Error al inicializar generadores:", err);
    }

    workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(workspace);
      console.clear();
      console.log("Código generado:\n", code);
    });

    workspaceInstance.current = workspace;
    return () => workspace.dispose();
  }, []);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="music-module">
      <HeaderNavbar variant="blue" />

      <header className="demo-header">
        <h1>Bloque Pacífico</h1>
        <button className="function-btn" onClick={handlePlay} disabled={isSaving}>
          {isSaving ? "Guardando..." : "▶ Reproducir"}
        </button>
        <button className="function-btn" onClick={handleStop}>
          ■ Detener
        </button>
      </header>

      <div className="workspace-layout">
        <div className="blockly-workspace" ref={workspaceRef}></div>

        <div className="right-panel">
          {currentLevel && (
            <div className="programacion-musical-instructions-card">
              <div className="instructions-card-img">
                {currentLevel.id === 1 && <img src={marimbaIcon} alt="Marimba nivel 1" />}
                {currentLevel.id === 2 && <img src={guasaIcon} alt="Guasá nivel 2" />}
                {currentLevel.id === 3 && <img src={tamboraIcon} alt="Tambora nivel 3" />}
                {currentLevel.id === 4 && <img src={cununoIcon} alt="Cununo nivel 4" />}
              </div>
              <div className="instructions-card-text">
                <h3>Instrucción</h3>

                {currentLevel.id === 1 && (
                  <p>
                    🎵 ¡Vamos a empezar nuestra aventura musical! Recuerda ir a la <b>caja de herramientas</b> en el
                    <b> panel izquierdo</b>, donde verás muchas <b>categorías</b>. Busca la categoría <b>“Instrumentos”</b> y usa
                    el bloque <b>“Tocar”</b> para traer todos los instrumentos una vez. ¡Escucha cómo suenan juntos! (En el bloque tocar
                    puedes elegir cada uno de los instrumentos) Usa siempre el bloque <b>"Reproducir"</b> en la categoria <b>"Tocar Instrumento"</b>
                  </p>
                )}

                {currentLevel.id === 2 && (
                  <p>
                    💫 ¡Hora de usar reglas mágicas! En la <b>caja de herramientas</b> busca la categoría
                    <b> “Condicionales”</b> y usa el bloque <b>“Si suenan”</b>. Haz que el <b>guasá</b> suene solo cuando
                    estén tocando la <b>marimba</b> y el <b>cununo</b>. ¡Así crearás una orquesta con tus propias reglas!
                  </p>
                )}

                {currentLevel.id === 3 && (
                  <p>
                    🪘 ¡Crea un ritmo pegajoso! Busca la categoría <b>“Ciclos”</b> y usa el bloque <b>“Repetir”</b>
                    para que la <b>marimba</b> y el <b>guasá</b> suenen <b>3 veces seguidas. </b> para que el ciclo se repita, ve a la categoria <b>"Números"</b> y trae el bloque <b>Número</b>.
                    lo puedes editar y colocarle el numero <b>3</b> ¡Escucha tu ritmo
                    del Pacífico repetirse una y otra vez!
                  </p>
                )}

                {currentLevel.id === 4 && (
                  <p>
                    🌟 ¡Ahora eres un compositor! En la <b>caja de herramientas</b>, busca la categoría
                    <b> “Funciones”</b> y crea una función con todos los instrumentos. Luego, repite esa función con
                    un <b>bucle</b> para tocarla <b>3 veces</b>. ¡Has creado tu primera canción completa!
                  </p>
                )}

              </div>

            </div>
          )}

          <div className="programacion-musical-levels-panel">
            {levelsMap.map((level) => {
              const icon =
                level.id === 1
                  ? marimbaIcon
                  : level.id === 2
                    ? guasaIcon
                    : level.id === 3
                      ? tamboraIcon
                      : cununoIcon;

              return (
                <button
                  key={level.id}
                  className={`level-btn ${currentLevel?.id === level.id ? "active" : ""} ${!level.isUnlocked ? "locked" : ""
                    }`}
                  onClick={() => {
                    if (!level.isUnlocked) return;
                    // Navegamos a la ruta con el levelId
                    navigate(`/programacion-musical/playground/${level.id}`);
                  }}
                  disabled={!level.isUnlocked}
                >
                  <img src={icon} alt={level.title} className="level-icon" />
                  <span>{level.title}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}