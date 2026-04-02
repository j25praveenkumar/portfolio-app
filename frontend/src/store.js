import { profile as defaultProfile, skills as defaultSkills, projects as defaultProjects, intro as defaultIntro } from "./data";

/* ── helpers ── */
const get = (key, fallback) => {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch {
        return fallback;
    }
};

const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ── profile ── */
export const getProfile = () => get("profile", defaultProfile);
export const saveProfile = (data) => set("profile", data);

/* ── skills ── */
export const getSkills = () => get("skills", defaultSkills);
export const saveSkills = (data) => set("skills", data);

/* ── projects ── */
export const getProjects = () => get("projects", defaultProjects);
export const saveProjects = (data) => set("projects", data);

/* ── intro ── */
export const getIntro = () => get("intro", defaultIntro);
export const saveIntro = (data) => set("intro", data);
