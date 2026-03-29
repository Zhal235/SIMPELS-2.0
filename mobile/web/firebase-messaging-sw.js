// Firebase Cloud Messaging Service Worker for PWA
// File: mobile/web/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDb4HCIj2NooINTG8C2NgIiSOF_0hm6IdA",
  authDomain: "simpels-faf58.firebaseapp.com",
  projectId: "simpels-faf58",
  storageBucket: "simpels-faf58.firebasestorage.app",
  messagingSenderId: "784979401590",
  appId: "1:784979401590:web:15a31c1e07210d66413857",
  measurementId: "G-JWL6DLJ55N"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'SIMPELS Mobile';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/Icon-192.png',
    badge: '/icons/Icon-192.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let urlToOpen = '/';

  // Route based on notification type
  if (notificationData) {
    switch (notificationData.type) {
      case 'payment_approved':
      case 'payment_rejected':
      case 'topup_approved':
        urlToOpen = `/?redirect=wallet_history&santri_id=${notificationData.santri_id}`;
        break;
      case 'new_tagihan':
      case 'tagihan_reminder':
        urlToOpen = '/?redirect=pembayaran';
        break;
      case 'announcement':
        urlToOpen = '/?redirect=announcement';
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === self.location.origin + urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
