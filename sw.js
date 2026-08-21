// Service worker minimo: solo existe para que el navegador ofrezca
// "Instalar app". Cachea el shell (para que abra mas rapido y funcione
// si no hay señal por un segundo), pero NUNCA cachea datos de Firebase,
// mapas o Nominatim - siempre van a la red, para no mostrar ubicaciones
// viejas guardadas por error.

const CACHE_NAME = 'gps-tracker-v1';
const ARCHIVOS_APP = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS_APP))
            .catch(e => console.log('SW: no se pudo cachear todo el shell', e))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(nombres =>
            Promise.all(nombres.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const esArchivoDelShell = url.origin === self.location.origin &&
        ARCHIVOS_APP.some(a => url.pathname.endsWith(a.replace('./', '')) || (a === './' && url.pathname.endsWith('/')));

    if (esArchivoDelShell) {
        // Shell de la app: intenta cache primero (rapido), si no existe va a la red
        event.respondWith(
            caches.match(event.request).then(resp => resp || fetch(event.request))
        );
    }
    // Todo lo demas (Firebase, tiles del mapa, Nominatim) no se intercepta:
    // el navegador lo maneja normal, siempre pidiendo a la red.
});
