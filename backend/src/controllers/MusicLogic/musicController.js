// backend/src/controllers/musicController.js
import db from '../../config/db.js';

// 🔹 Función auxiliar para parsear JSON seguro
function safeParseJSON(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value; // MySQL 8 ya devuelve JSON como objeto
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// GET /api/music/levels-map/:userId
export async function getMusicLevelsMap(req, res) {
  try {
    const userId = req.params.userId;
    // ⬇️ ahora también pedimos instruments y rules
    const [levels] = await db.query(
      `SELECT id, level_number, title, description, instruments, rules 
       FROM music_levels 
       WHERE is_active = TRUE 
       ORDER BY level_number ASC`
    );

    const [progressRows] = await db.query(
      `SELECT level_id, is_completed 
       FROM music_user_progress 
       WHERE user_id = ?`,
      [userId]
    );

    const progressMap = {};
    progressRows.forEach(p => { progressMap[p.level_id] = p.is_completed; });

    const levelsWithStatus = levels.map((level, index) => {
      const isCompleted = !!progressMap[level.id];
      const isUnlocked = index === 0
        ? true
        : !!progressMap[levels[index - 1].id];

      return {
        id: level.id,
        number: level.level_number,
        title: level.title,
        description: level.description,
        instruments: safeParseJSON(level.instruments, []),
        rules: safeParseJSON(level.rules, {}),   // ⬅️ ahora vendrán tus reglas JSON
        isCompleted,
        isUnlocked
      };
    });

    res.json(levelsWithStatus);
  } catch (error) {
    console.error("Error in getMusicLevelsMap:", error);
    res.status(500).json({ message: "Error al obtener mapa de niveles musicales" });
  }
}

// GET /api/music/progress/:userId/:levelId
export async function getUserMusicProgress(req, res) {
  try {
    const { userId, levelId } = req.params;
    const [rows] = await db.query(
      `SELECT p.id, p.user_id, p.level_id, p.is_completed, p.last_saved_workspace, 
              l.level_number, l.title, l.description 
       FROM music_user_progress p
       INNER JOIN music_levels l ON p.level_id = l.id
       WHERE p.user_id = ? AND p.level_id = ?
       LIMIT 1`,
      [userId, levelId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "No hay progreso registrado" });

    let workspace = rows[0].last_saved_workspace;
    if (typeof workspace === 'string') {
      try { workspace = JSON.parse(workspace); } catch { workspace = null; }
    }

    res.json({
      id: rows[0].id,
      userId: rows[0].user_id,
      levelId: rows[0].level_id,
      isCompleted: !!rows[0].is_completed,
      lastSavedWorkspace: workspace,
      levelNumber: rows[0].level_number,
      title: rows[0].title,
      description: rows[0].description
    });
  } catch (error) {
    console.error("Error in getUserMusicProgress:", error);
    res.status(500).json({ message: "Error al obtener progreso musical" });
  }
}

// POST /api/music/progress
export async function createOrUpdateMusicProgress(req, res) {
  try {
    const { userId, levelId, isCompleted, lastSavedWorkspace } = req.body;
    await db.query(
      `INSERT INTO music_user_progress (user_id, level_id, is_completed, last_saved_workspace)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_completed = VALUES(is_completed),
         last_saved_workspace = VALUES(last_saved_workspace),
         updated_at = NOW()`,
      [userId, levelId, isCompleted, JSON.stringify(lastSavedWorkspace)]
    );
    res.json({ message: "Progreso musical guardado/actualizado correctamente" });
  } catch (error) {
    console.error("Error in createOrUpdateMusicProgress:", error);
    res.status(500).json({ message: "Error al guardar progreso musical" });
  }
}

// GET /api/music/init/:levelId  -> devuelve config del nivel
export async function initMusicLevel(req, res) {
  try {
    const { levelId } = req.params;
    const [rows] = await db.query(
      `SELECT id, level_number, title, description, instruments, rules 
       FROM music_levels 
       WHERE id = ? 
       LIMIT 1`,
      [levelId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Nivel no encontrado" });

    const lvl = rows[0];
    res.json({
      ok: true,
      id: lvl.id,
      number: lvl.level_number,
      title: lvl.title,
      description: lvl.description,
      instruments: safeParseJSON(lvl.instruments, []),
      rules: safeParseJSON(lvl.rules, {})
    });
  } catch (error) {
    console.error("Error in initMusicLevel:", error);
    res.status(500).json({ message: "Error al inicializar nivel musical" });
  }
}
