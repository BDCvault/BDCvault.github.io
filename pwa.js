// BDC Vault PWA & App Store Style Update Engine
(function() {
  const CURRENT_VERSION = "v4.7.1";
  const RELEASE_DATE = "September 2, 2026";
  const WHATS_NEW = [
    "Removed subtitle from main navigation banner for clean luxury aesthetic.",
    "Updated version badge display to v4.7.1.",
    "Streamlined navbar branding across desktop and mobile."
  ];

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

  // 3. Inject Version Badges
  function injectVersionBadges() {
    const versionHolders = document.querySelectorAll('.bdc-version-tag');
    versionHolders.forEach(el => {
      el.innerText = CURRENT_VERSION;
      el.title = "Click to see What's New";
      el.style.cursor = "pointer";
      el.onclick = () => showWhatsNewModal(CURRENT_VERSION, WHATS_NEW, false);
    });
  }

  // 4. Register Service Worker & Listen for Updates
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log(`💎 BDC Vault Service Worker (${CURRENT_VERSION}) Registered!`);

          // Check for existing waiting worker
          if (reg.waiting) {
            waitingWorker = reg.waiting;
            fetchLatestChangelogAndShow(true);
          }

          // Listen for new updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  waitingWorker = newWorker;
                  fetchLatestChangelogAndShow(true);
                }
              });
            }
          });

          // Check every 15 minutes
          setInterval(() => { reg.update(); }, 15 * 60 * 1000);

          // Check on tab focus
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

  async function fetchLatestChangelogAndShow(isLiveUpdate) {
    try {
      const res = await fetch('./version.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        showWhatsNewModal(data.version || CURRENT_VERSION, data.highlights || WHATS_NEW, isLiveUpdate);
      } else {
        showWhatsNewModal(CURRENT_VERSION, WHATS_NEW, isLiveUpdate);
      }
    } catch(e) {
      showWhatsNewModal(CURRENT_VERSION, WHATS_NEW, isLiveUpdate);
    }
  }

  // 5. App Store Style "What's New" Sheet
  function showWhatsNewModal(version, notes, isLiveUpdate) {
    const existing = document.getElementById('pwaWhatsNewModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pwaWhatsNewModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 20px;
      animation: fadeIn 0.25s ease;
    `;

    const notesHtml = notes.map(item => `
      <li style="margin-bottom: 8px; color: #e2e8f0; font-size: 0.92rem; line-height: 1.4; display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: #a855f7; font-weight: bold; font-size: 1.1rem; line-height: 1;">•</span>
        <span>${item}</span>
      </li>
    `).join('');

    const actionBtnHtml = isLiveUpdate ? `
      <button onclick="window.reloadAppForUpdate()" style="
        flex: 1;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        color: white;
        border: none;
        padding: 14px 20px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
        transition: all 0.2s;
      ">🔄 Update & Refresh Now</button>
      <button onclick="document.getElementById('pwaWhatsNewModal').remove()" style="
        background: rgba(255, 255, 255, 0.08);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 14px 18px;
        border-radius: 14px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
      ">Later</button>
    ` : `
      <button onclick="document.getElementById('pwaWhatsNewModal').remove()" style="
        width: 100%;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        color: white;
        border: none;
        padding: 14px 20px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
      ">Got it ➔</button>
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a;
        border: 1px solid rgba(168, 85, 247, 0.4);
        border-radius: 24px;
        padding: 32px 28px;
        max-width: 440px;
        width: 100%;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(168, 85, 247, 0.2);
        font-family: 'Outfit', sans-serif;
      ">
        <!-- App Header (App Store Style) -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div style="
            width: 56px; height: 56px;
            background: linear-gradient(135deg, #1e1b4b, #0f172a);
            border: 2px solid rgba(168, 85, 247, 0.5);
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          ">💎</div>
          <div>
            <h2 style="margin: 0; color: white; font-size: 1.35rem; font-weight: 800;">BDC Vault</h2>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="
                background: rgba(168, 85, 247, 0.2);
                color: #d8b4fe;
                border: 1px solid rgba(168, 85, 247, 0.4);
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 700;
              ">${version}</span>
              <span style="color: #64748b; font-size: 0.8rem;">${isLiveUpdate ? 'Update Available' : 'Installed Version'}</span>
            </div>
          </div>
        </div>

        <!-- What's New Header -->
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            What's New in ${version}
          </h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${notesHtml}
          </ul>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 10px; margin-top: 24px;">
          ${actionBtnHtml}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  window.showWhatsNewModal = function() {
    showWhatsNewModal(CURRENT_VERSION, WHATS_NEW, false);
  };

  window.reloadAppForUpdate = function() {
    if (waitingWorker) {
      waitingWorker.postMessage({ action: 'skipWaiting' });
    } else {
      window.location.reload(true);
    }
  };

  // 6. Handle Install Prompt
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

  // Initial checks on load
  document.addEventListener('DOMContentLoaded', () => {
    checkAndHideInstallButtons();
    injectVersionBadges();
  });
})();
