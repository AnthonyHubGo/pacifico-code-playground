import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { API_URL } from "../../api/apiUrl.js";

// const API_URL = import.meta.env.VITE_BACKEND_URL;

// --- Thunks ---
export const fetchLevelsMap = createAsyncThunk(
  "music/fetchLevelsMap",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/api/music/levels-map/${userId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Error en fetchLevelsMap:", err.response || err);
      return rejectWithValue(err.response?.data || "Error cargando niveles");
    }
  }
);

export const fetchLevelInit = createAsyncThunk(
  "music/fetchLevelInit",
  async (levelId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/api/music/init/${levelId}`);
      console.log("✅ fetchLevelInit data:", res.data);
      return res.data; // { ok, id, number, title, description, instruments, rules }
    } catch (err) {
      console.error("❌ Error en fetchLevelInit:", err.response || err);
      return rejectWithValue(err.response?.data || "Error cargando nivel");
    }
  }
);

export const saveProgress = createAsyncThunk(
  "music/saveProgress",
  async ({ userId, levelId, isCompleted, lastSavedWorkspace }, { rejectWithValue }) => {
    try {
      await api.post(`${API_URL}/api/music/progress`, {
        userId,
        levelId,
        isCompleted,
        lastSavedWorkspace
      });
      console.log("✅ Progreso guardado:", { levelId, isCompleted });
      return { levelId, isCompleted, lastSavedWorkspace };
    } catch (err) {
      console.error("❌ Error en saveProgress:", err.response || err);
      return rejectWithValue(err.response?.data || "Error guardando progreso");
    }
  }
);

// --- Slice ---
const musicSlice = createSlice({
  name: "music",
  initialState: {
    levelsMap: [],
    currentLevel: null,   // respuesta de /api/music/init/:levelId
    progress: {},         // { [levelId]: { isCompleted, lastSavedWorkspace } }
    status: "idle",       // idle | loading | succeeded | failed
    error: null
  },
  reducers: {
    setCurrentLevel: (state, action) => {
      state.currentLevel = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Levels map
      .addCase(fetchLevelsMap.pending, (state) => { state.status = "loading"; })
      .addCase(fetchLevelsMap.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.levelsMap = action.payload;
      })
      .addCase(fetchLevelsMap.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Level init
      .addCase(fetchLevelInit.pending, (state) => { state.status = "loading"; })
      .addCase(fetchLevelInit.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentLevel = action.payload;
      })
      .addCase(fetchLevelInit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Save progress
      .addCase(saveProgress.fulfilled, (state, action) => {
        const { levelId, isCompleted, lastSavedWorkspace } = action.payload;
        state.progress[levelId] = { isCompleted, lastSavedWorkspace };
        if (state.currentLevel?.id === levelId) {
          state.currentLevel.isCompleted = isCompleted;
        }
      });
  }
});

export const { setCurrentLevel } = musicSlice.actions;
export default musicSlice.reducer;
