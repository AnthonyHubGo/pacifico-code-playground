export function validateMusicCode(code, rules) {
  if (!rules || !rules.type) return false;

  const codeLower = (code || "").toLowerCase();

  // Limpieza general
  const clean = (text) =>
    String(text)
      .toLowerCase()
      .replaceAll('"', "")
      .replaceAll("'", "")
      .replaceAll(";", "")
      .trim();

  // Acepta instruments como array o single instrument
  const list = Array.isArray(rules.instruments)
    ? rules.instruments
    : rules.instrument
    ? [rules.instrument]
    : [];

  // Extrae solo el nombre base del archivo
  const toBase = (s) => {
    const base = clean(s).split("/").pop();
    return base.replace(".wav", "");
  };

  const instruments = list.map(toBase);
  const times = Number(rules.times ?? 1);

  // Detectar bucles for(... i < times ...)
  const loopRegex = new RegExp(
    String.raw`for\s*\(\s*(?:let|var|const)\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*${times}\s*;\s*\w+\+\+\s*\)`,
    "i"
  );

  const hasEveryInstrument =
    instruments.length > 0 && instruments.every((inst) => codeLower.includes(inst));
  const hasSomeInstrument =
    instruments.length > 0 && instruments.some((inst) => codeLower.includes(inst));

  // -----------------------------
  // N1: play-all
  // -----------------------------
  if (rules.type === "play-all") {
    return hasEveryInstrument && !codeLower.includes("for") && !codeLower.includes("if");
  }

  // -----------------------------
  // N2: if-condition (MEJORADO)
  // -----------------------------
  // 🪘 Nivel 2: if-condition (mejorado)
if (rules.type === "if-condition") {
  // Debe existir un if
  if (!codeLower.includes("if")) return false;

  const toBase = (s) => {
    const base = String(s).toLowerCase().split("/").pop();
    return base.replace(".wav", "");
  };

  // Instrumento que debe sonar en el cuerpo del if (guasa)
  const targetBase = rules.instrument ? toBase(rules.instrument) : "guasa";
  const targetRegex = new RegExp(`playsound\\(\\s*["'][^"']*${targetBase}\\.wav["']\\s*\\)`, "i");
  const targetPlay = targetRegex.test(code);
  if (!targetPlay) return false;

  // Operador
  let operator = String(rules.operator || "and").toLowerCase();
  if (operator === "y") operator = "and";
  if (operator === "o") operator = "or";

  // Instrumentos de la condición
  let condList = [];
  if (Array.isArray(rules.condition_instruments) && rules.condition_instruments.length >= 2) {
    condList = rules.condition_instruments.map(toBase);
  } else if (Array.isArray(rules.instruments) && rules.instruments.length >= 2) {
    // Derivar: de la lista de instrumentos del nivel, quita el que suena en el cuerpo del if (guasa)
    condList = rules.instruments.map(toBase).filter(b => b !== targetBase).slice(0, 2);
  } else {
    // Fallback sensato por tu caso
    condList = ["marimba_de_chonta", "cununo"];
  }

  // Verificar que la condición usa isPlaying de esos instrumentos
  const cond1 = codeLower.includes(`isplaying("${condList[0]}")`);
  const cond2 = codeLower.includes(`isplaying("${condList[1]}")`);
  const condOK = operator === "or" ? (cond1 || cond2) : (cond1 && cond2);

  // 5️⃣ Verificar que el código general incluya los sonidos base en el bloque principal
// Esto asegura que el usuario realmente los haya colocado bajo "reproducir"
const requiredSoundsPresent =
  codeLower.includes("playsound(\"/sonidos/marimba_de_chonta.wav\"") &&
  codeLower.includes("playsound(\"/sonidos/cununo.wav\"");

// Si no están ambos playSound de marimba y cununo, el nivel no debe validarse
if (!requiredSoundsPresent) {
  return false;
}


  return condOK && targetPlay && requiredSoundsPresent;
}


  // -----------------------------
  // N3: loop
  // -----------------------------
  if (rules.type === "loop") {
    return loopRegex.test(codeLower) && hasSomeInstrument;
  }

  // -----------------------------
  // N4: function-with-loop
  // -----------------------------
  if (rules.type === "function-with-loop") {
    return (
      codeLower.includes("async function") &&
      loopRegex.test(codeLower) &&
      hasEveryInstrument
    );
  }

  return false;
}
