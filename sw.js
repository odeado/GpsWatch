// Service worker minimo: solo existe para que el navegador ofrezca
// "Instalar app". Cachea el shell (para que abra mas rapido y funcione
// si no hay señal por un segundo), pero NUNCA cachea datos de Firebase,
// mapas o Nominatim - siempre van a la red, para no mostrar ubicaciones
// viejas guardadas por error.

// v2: el index.html ahora es "red primero" (antes era "cache primero" y
// se quedaba pegado mostrando versiones viejas cada vez que actualizabamos
// el codigo, aunque ya estuviera subido a GitHub). El resto del shell
// (iconos, manifest) si sigue cache-primero porque cambia poco.
const CACHE_NAME = 'gps-tracker-v2';
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

    if (!esArchivoDelShell) return; // Firebase, mapas, Nominatim: sin tocar, siempre a la red

    const esHTML = event.request.mode === 'navigate' ||
        url.pathname.endsWith('index.html') ||
        url.pathname.endsWith('/');

    if (esHTML) {
        // RED PRIMERO: siempre intenta traer la version mas nueva.
        // Solo si no hay conexion, usa la ultima copia guardada.
        event.respondWith(
            fetch(event.request)
                .then(resp => {
                    const copia = resp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
                    return resp;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Iconos/manifest: cache primero, cambian poco, mas rapido asi
        event.respondWith(
            caches.match(event.request).then(resp => resp || fetch(event.request))
        );
    }
});
