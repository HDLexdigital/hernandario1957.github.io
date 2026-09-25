/**
 * src/config/profiles.js
 * Perfiles de salida autorizados (Inmutables)
 */
const OUTPUT_PROFILES = Object.freeze({
    WEB: 'WEB',
    EPUB: 'EPUB'
});

function isValidProfile(profile) {
    return Object.values(OUTPUT_PROFILES).includes(profile);
}

module.exports = {
    OUTPUT_PROFILES,
    isValidProfile
};
