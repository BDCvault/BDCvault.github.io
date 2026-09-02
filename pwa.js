// BDC Vault PWA Installer & Service Worker Manager
(function() {
  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('💎 BDC Vault Service Worker Registered! Scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    });
  }

  // 2. Manage PWA Installation Prompt
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    
    // Show Install Buttons if present
    const installBtns = document.querySelectorAll('.btn-pwa-install');
    installBtns.forEach(btn => {
      btn.style.display = 'inline-flex';
      btn.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] User response to install:', outcome);
          deferredPrompt = null;
          btn.style.display = 'none';
        }
      };
    });
  });

  window.addEventListener('appinstalled', () => {
    console.log('💎 BDC Vault App Installed Successfully!');
    const installBtns = document.querySelectorAll('.btn-pwa-install');
    installBtns.forEach(btn => btn.style.display = 'none');
  });

  // Global helper to trigger install prompt
  window.triggerPWAInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      // Check iOS
      const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
      };
      if (isIos()) {
        alert("To install BDC Vault on iOS: Tap the Share button (square with arrow) and select 'Add to Home Screen' 📲");
      } else {
        alert("BDC Vault is Web App ready! You can install it via your browser's menu (Add to Home Screen / Install App).");
      }
    }
  };
})();
