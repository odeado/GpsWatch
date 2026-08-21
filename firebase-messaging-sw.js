// Service worker de Firebase Cloud Messaging. Este es el que muestra
// las notificaciones cuando el navegador esta CERRADO o minimizado
// del todo (no solo en segundo plano con la pestaña abierta).

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAMGi4dczBL1VYdSx9UUsCsmlp1i3Hcw_w",
    authDomain: "sensorgps-a3027.firebaseapp.com",
    projectId: "sensorgps-a3027",
    messagingSenderId: "883990627894",
    appId: "1:883990627894:web:ab03dc5065b7a241acba97"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const titulo = payload.notification?.title || 'GPS Tracker';
    const opciones = {
        body: payload.notification?.body || '',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: 'gps-tracker-evento'
    };
    self.registration.showNotification(titulo, opciones);
});