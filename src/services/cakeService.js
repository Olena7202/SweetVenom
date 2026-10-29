import { detailPhoto } from "../data/cakePhotos";
import { cakeDescription, cakeName } from "../data/catalogCopy";
import api from '../api/axiosConfig'

const FAVORITE_CAKES_KEY = "bakery_favorite_cakes";
const CAKE_CUSTOMIZATIONS_KEY = "bakery_cake_customizations";
const CONFECTIONER_CAKES_KEY = "bakery_confectioner_cakes";
const CONFECTIONER_CAKE_EDITS_KEY = "bakery_confectioner_cake_edits";

function readJsonArray(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeJsonArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getConfectionerCakeIds(userId) {
    if (!userId) return [];
    const mappings = readJsonArray(CONFECTIONER_CAKES_KEY);
    const item = mappings.find((entry) => Number(entry.userId) === Number(userId));
    return Array.isArray(item?.cakeIds) ? item.cakeIds : [];
}

export function saveConfectionerCakeIds(userId, cakeIds) {
    if (!userId) return;
    const mappings = readJsonArray(CONFECTIONER_CAKES_KEY);
    const normalizedIds = Array.from(new Set((cakeIds || []).map((id) => Number(id)).filter(Boolean)));
    const next = [
        { userId, cakeIds: normalizedIds },
        ...mappings.filter((entry) => Number(entry.userId) !== Number(userId))
    ];
    writeJsonArray(CONFECTIONER_CAKES_KEY, next);
}

export function ensureConfectionerCakeIds(userId, allCakes) {
    return allCakes.map(cake => cake.id);
}

export function getConfectionerCakeEdits(userId) {
    if (!userId) return [];
    return readJsonArray(CONFECTIONER_CAKE_EDITS_KEY).filter(
        (item) => Number(item.userId) === Number(userId)
    );
}

export function applyConfectionerCakeEdits(userId, cakes) {
    return cakes;
}

export async function saveConfectionerCakeEdit(userId, cakeId, patch) {
    console.log('Saving cake edit:', cakeId, patch);
    const response = await api.put(`/cakes/${cakeId}`, { id: cakeId, ...patch });
    return response.data;
}

export async function removeConfectionerCake(userId, cakeId) {
    await api.delete(`/cakes/${cakeId}`);
}

export async function createCake(cake) {
    const response = await api.post('/cakes', cake);
    return response.data;
}

export async function getCakes() {
    const response = await api.get('/cakes');
    return Array.isArray(response.data) ? response.data.map((cake) => ({ ...cake, name: cakeName(cake.name), description: cakeDescription(cake.photoUrl, cake.description), photoUrl: detailPhoto(cake.photoUrl) })) : [];
}

export async function getCakesById(id) {
    const response = await api.get(`/cakes/${id}`);
    const cake = response.data;
    return { ...cake, name: cakeName(cake.name), description: cakeDescription(cake.photoUrl, cake.description) };
}

export async function getCategories() {
    const response = await api.get('/categories');
    return response.data;
}

export async function getBiscuits() {
    const response = await api.get('/biscuits');
    return response.data;
}

export async function getCreams() {
    const response = await api.get('/creams');
    return response.data;
}

export async function getSavedCakes(clientId) {
    try {
        const response = await api.get(`/savedcakes/client/${clientId}`);
        const remote = Array.isArray(response.data) ? response.data : [];
        const local = getFavoriteCakesByClient(clientId);

        const existingCakeIds = new Set(
            remote.map((item) => item.cakeId ?? item.cake?.id).filter(Boolean)
        );
        const mergedLocal = local.filter((item) => !existingCakeIds.has(item.cakeId ?? item.cake?.id));

        return [...remote, ...mergedLocal];
    } catch {
        return getFavoriteCakesByClient(clientId);
    }
}

export function getFavoriteCakesByClient(clientId) {
    return readJsonArray(FAVORITE_CAKES_KEY).filter(
        (item) => Number(item.clientId) === Number(clientId)
    );
}

export function saveFavoriteCake({ clientId, cake, customization = null }) {
    const favorites = readJsonArray(FAVORITE_CAKES_KEY);
    const exists = favorites.find(
        (item) =>
            Number(item.clientId) === Number(clientId) &&
            Number(item.cakeId) === Number(cake.id)
    );

    if (exists) {
        const item = { ...exists, cake, customization };
        writeJsonArray(FAVORITE_CAKES_KEY, favorites.map((entry) => entry === exists ? item : entry));
        return { ok: true, alreadyExists: true, item };
    }

    const item = {
        id: Date.now(),
        clientId,
        cakeId: cake.id,
        cake,
        customization,
        createdAt: new Date().toISOString()
    };

    writeJsonArray(FAVORITE_CAKES_KEY, [item, ...favorites]);
    return { ok: true, alreadyExists: false, item };
}

export function removeFavoriteCake(clientId, cakeId) {
    const favorites = readJsonArray(FAVORITE_CAKES_KEY);
    const next = favorites.filter(
        (item) =>
            !(Number(item.clientId) === Number(clientId) && Number(item.cakeId) === Number(cakeId))
    );
    writeJsonArray(FAVORITE_CAKES_KEY, next);
}

export function saveCakeCustomization({ clientId, cakeId, biscuitId, biscuitName, creamId, creamName, totalPrice }) {
    const all = readJsonArray(CAKE_CUSTOMIZATIONS_KEY);
    const item = {
        id: Date.now(),
        clientId,
        cakeId,
        biscuitId: biscuitId ?? null,
        biscuitName: biscuitName ?? "",
        creamId: creamId ?? null,
        creamName: creamName ?? "",
        totalPrice,
        updatedAt: new Date().toISOString()
    };

    const filtered = all.filter(
        (entry) =>
            !(Number(entry.clientId) === Number(clientId) && Number(entry.cakeId) === Number(cakeId))
    );
    writeJsonArray(CAKE_CUSTOMIZATIONS_KEY, [item, ...filtered]);
    return item;
}

export function getCakeCustomization(clientId, cakeId) {
    const all = readJsonArray(CAKE_CUSTOMIZATIONS_KEY);
    return (
        all.find(
            (item) =>
                Number(item.clientId) === Number(clientId) && Number(item.cakeId) === Number(cakeId)
        ) ?? null
    );
}

export async function saveCake(clientId, cakeId) {
    return saveFavoriteCake({ clientId, cake: { id: cakeId } });
}

export async function unsaveCake(savedCakeId) {
    if (!savedCakeId) return;
    try {
        await api.delete(`/savedcakes/${savedCakeId}`);
    } catch {
        // Ignore in frontend-only mode.
    }
}
