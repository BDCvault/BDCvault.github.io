// BDC Vault PWA Manager & Live Upgrade Notification Engine
(function() {
  let waitingWorker = null;
  let refreshing = false;
  let deferredPrompt = null;

  // 1. Check if running as Installed Standalone App
  function isAppInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('bdc_pwa_installed') === 'true'
    );
  }

  // 2. Hide Install Buttons if already installed
  function checkAndHideInstallButtons() {
    if (isAppInstalled()) {
      const installBtns = document.querySelectorAll('.btn-pwa-install');
      installBtns.forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // 3. Register Service Worker & Listen for Updates
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('💎 BDC Vault Service Worker Registered! Scope:', reg.scope);

          // Check for existing waiting worker
          if (reg.waiting) {
            waitingWorker = reg.waiting;
            showUpdateBanner();
          }

          // Listen for new updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  waitingWorker = newWorker;
                  showUpdateBanner();
                }
              });
            }
          });

          // Periodically check for updates every 15 minutes
          setInterval(() => {
            reg.update();
          }, 15 * 60 * 1000);

          // Check for update when user returns to tab
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update();
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });

      // Handle controller change (reload after update)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // 4. Create & Show Upgrade Alert Banner
  function showUpdateBanner() {
    if (document.getElementById('pwaUpdateBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwaUpdateBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border: 1px solid rgba(168, 85, 247, 0.5);
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.3);
      display: flex;
      align-items: center;
      gap: 16px;
      animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 400px;
      backdrop-filter: blur(16px);
    `;

    banner.innerHTML = `
      <style>
        @keyframes pwaSlideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .btn-update-reload {
          background: linear-gradient(135deg, #a855f7, #6366f1);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
        }
        .btn-update-reload:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(168, 85, 247, 0.6);
        }
      </style>
      <div style="font-size: 26px;">⚡</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: white; font-size: 0.95rem;">New Update Ready!</div>
        <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 2px;">A fresh version of BDC Vault is available.</div>
      </div>
      <button class="btn-update-reload" onclick="window.reloadAppForUpdate()">
        🔄 Refresh
      </button>
    `;

    document.body.appendChild(banner);
  }

  window.reloadAppForUpdate = function() {
    const btn = document.querySelector('.btn-update-reload');
    if (btn) btn.innerText = 'Updating...';

    if (waitingWorker) {
      waitingWorker.postMessage({ action: 'skipWaiting' });
    } else {
      window.location.reload(true);
    }
  };

  // 5. Handle Install Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!isAppInstalled()) {
      const installBtns = document.querySelectorAll('.btn-pwa-install');
      installBtns.forEach(btn => {
        btn.style.display = 'inline-flex';
        btn.onclick = async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              localStorage.setItem('bdc_pwa_installed', 'true');
              checkAndHideInstallButtons();
            }
            deferredPrompt = null;
          }
        };
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('💎 BDC Vault App Installed Successfully!');
    localStorage.setItem('bdc_pwa_installed', 'true');
    checkAndHideInstallButtons();
  });

  // Global helper for manual install click
  window.triggerPWAInstall = function() {
    if (isAppInstalled()) {
      alert("💎 BDC Vault is already installed and running in native App mode.");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
      };
      if (isIos()) {
        alert("To install BDC Vault on iOS: Tap the Safari Share button (square with arrow ⬆️) and select 'Add to Home Screen' 📲");
      } else {
        alert("BDC Vault is Web App ready! You can install it via your browser's menu (Add to Home Screen / Install App).");
      }
    }
  };

  // Initial check on load
  document.addEventListener('DOMContentLoaded', checkAndHideInstallButtons);
})();
