import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_MS = 5 * 60 * 1000;

let reloading = false;

function reloadOnce(): void {
  if (reloading) {
    return;
  }
  reloading = true;
  window.location.reload();
}

function checkRegistration(registration: ServiceWorkerRegistration): void {
  registration.update().catch(() => {
    // Offline or transient failure; try again next time
  });
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true).catch(() => {
        // skipWaiting still activates the worker on the next load
      });
    },
    onRegisteredSW(_url, registration) {
      if (!registration) {
        return;
      }
      const checkForUpdates = () => {
        checkRegistration(registration);
      };
      window.setTimeout(checkForUpdates, 3_000);
      window.setInterval(checkForUpdates, UPDATE_CHECK_MS);
      window.addEventListener('focus', checkForUpdates);
      window.addEventListener('online', checkForUpdates);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdates();
        }
      });
    },
  });

  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
}
