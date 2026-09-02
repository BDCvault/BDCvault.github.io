// BDC Vault PWA & wosBDC Style Live App Update Alert Engine
(function() {
  const CURRENT_BUILD_VERSION = "4.7.5";
  let deferredPrompt = null;

  // 1. Version Comparison Logic (from wosBDC)
  function isVersionOutdated(localVer, remoteVer) {
    if (!remoteVer || !localVer) return false;
    const cleanL = String(localVer).replace(/^v/, '').trim();
    const cleanR = String(remoteVer).replace(/^v/, '').trim();
    if (cleanL === cleanR) return false;

    const v1 = cleanL.split('.').map(n => parseInt(n, 10) || 0);
    const v2 = cleanR.split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(v1.length, v2.length);

    for (let i = 0; i < len; i++) {
      const s = v2[i] || 0; // remote
      const l = v1[i] || 0; // local
      if (s > l) return true;
      if (s < l) return false;
    }
    return false;
  }

  // 2. Installed App Detection
  function isAppInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('bdc_pwa_installed') === 'true'
    );
  }

  function checkAndHideInstallButtons() {
    if (isAppInstalled()) {
      const installBtns = document.querySelectorAll('.btn-pwa-install');
      installBtns.forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // 3. wosBDC Style Floating App Update Alert Sheet
  function showUpdateBanner(updateData, isManualPreview = false) {
    if (document.getElementById('app-update-modal-banner')) return;
    if (!isManualPreview) {
      if (localStorage.getItem('bdc_dismissed_update') === updateData.version) return;
      if (localStorage.getItem('bdc_app_version') === updateData.version) return;
    }

    const banner = document.createElement('div');
    banner.id = 'app-update-modal-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(120%);
      width: calc(100% - 32px);
      max-width: 480px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.98));
      border: 1px solid rgba(168, 85, 247, 0.6);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.3);
      border-radius: 20px;
      padding: 20px;
      z-index: 999999;
      color: #f1f5f9;
      font-family: 'Outfit', -apple-system, sans-serif;
      backdrop-filter: blur(16px);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    const notesList = (updateData.notes || updateData.highlights || [
      "Converted BDC Vault into an installable Web App.",
      "Added live Borrower Directory to Executive Center.",
      "Built ledger transaction editor with balance recalculations."
    ])
      .map(n => `<li style="margin-bottom: 6px; font-size: 0.88rem; color: #e2e8f0; display:flex; align-items:flex-start; gap:8px;"><span style="color:#a855f7; font-weight:bold;">✨</span><span>${n}</span></li>`)
      .join('');

    banner.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
        <div style="display:flex; align-items:center; gap: 10px;">
          <span style="font-size: 1.6rem; filter: drop-shadow(0 0 10px #a855f7);">💎</span>
          <div>
            <div style="font-weight: 800; font-size: 1.08rem; color: #ffffff;">BDC Vault Update Ready!</div>
            <div style="font-size: 0.8rem; color: #a855f7; font-weight:600;">New Version v${updateData.version} is available</div>
          </div>
        </div>
        <span style="background: rgba(168, 85, 247, 0.2); border: 1px solid #a855f7; color: #d8b4fe; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 12px;">v${updateData.version}</span>
      </div>
      
      <div style="margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">What's New</div>
        <ul style="list-style: none; margin: 0; padding: 0;">${notesList}</ul>
      </div>

      <div style="display:flex; gap: 10px;">
        <button id="btn-force-update-app" style="flex: 2; background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: white; font-weight: 800; font-size: 0.95rem; padding: 12px; border-radius: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); transition: all 0.2s;">
          ⚡ Update App Now
        </button>
        <button id="btn-dismiss-update-app" style="flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 600; font-size: 0.9rem; padding: 12px; border-radius: 14px; cursor: pointer;">
          Later
        </button>
      </div>
    `;

    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    document.getElementById('btn-force-update-app').addEventListener('click', async () => {
      const btn = document.getElementById('btn-force-update-app');
      btn.innerText = 'Updating & Reloading...';
      btn.disabled = true;

      localStorage.setItem('bdc_app_version', updateData.version);

      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (let r of regs) await r.unregister();
        } catch (e) {}
      }
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          for (let k of keys) await caches.delete(k);
        } catch (e) {}
      }
      window.location.href = window.location.pathname + '?v=' + Date.now() + window.location.hash;
    });

    document.getElementById('btn-dismiss-update-app').addEventListener('click', () => {
      localStorage.setItem('bdc_dismissed_update', updateData.version);
      banner.style.transform = 'translateX(-50%) translateY(120%)';
      setTimeout(() => banner.remove(), 400);
    });
  }

  // 4. Check App Version Engine (wosBDC Architecture)
  async function checkAppVersion(isManualCheck = false, btn = null) {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Checking...';
    }
    try {
      let res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      }
      if (!res || !res.ok) {
        if (isManualCheck && btn) {
          btn.innerHTML = '⚠️ Check Failed';
          setTimeout(() => { btn.innerHTML = '↻ Check for Updates'; btn.disabled = false; }, 2500);
        }
        return;
      }

      const data = await res.json();
      if (data && data.version) {
        if (isVersionOutdated(CURRENT_BUILD_VERSION, data.version)) {
          showUpdateBanner(data);
          if (btn) {
            btn.innerHTML = '✨ Update Available!';
            btn.disabled = false;
          }
        } else {
          localStorage.setItem('bdc_app_version', data.version);
          if (isManualCheck) {
            if (btn) {
              btn.innerHTML = '✅ Up to Date!';
              setTimeout(() => { btn.innerHTML = '↻ Check for Updates'; btn.disabled = false; }, 2500);
            }
            showUpdateBanner(data, true); // Show "What's New" preview even when up to date
          }
        }
      }
    } catch (err) {
      if (isManualCheck && btn) {
        btn.innerHTML = '↻ Check for Updates';
        btn.disabled = false;
      }
    }
  }

  // 5. Version Badge Injection
  function injectVersionBadges() {
    const versionHolders = document.querySelectorAll('.bdc-version-tag');
    versionHolders.forEach(el => {
      el.innerText = `v${CURRENT_BUILD_VERSION}`;
      el.title = "Click to check for updates & view changelog";
      el.style.cursor = "pointer";
      el.onclick = () => checkAppVersion(true);
    });
  }

  // 6. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log(`💎 BDC Vault Service Worker (v${CURRENT_BUILD_VERSION}) Registered!`);

          // Check for waiting worker
          if (reg.waiting) {
            checkAppVersion();
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  checkAppVersion();
                }
              });
            }
          });

          // Check every 10 minutes
          setInterval(() => {
            reg.update();
            checkAppVersion();
          }, 10 * 60 * 1000);

          // Check on tab focus
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update();
              checkAppVersion();
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    });
  }

  // 7. Install Prompt Management
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

  window.triggerPWAInstall = function() {
    if (isAppInstalled()) {
      alert("💎 BDC Vault is already installed and running in native App mode.");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos()) {
        alert("To install BDC Vault on iOS: Tap the Safari Share button (square with arrow ⬆️) and select 'Add to Home Screen' 📲");
      } else {
        alert("BDC Vault is Web App ready! You can install it via your browser's menu (Add to Home Screen / Install App).");
      }
    }
  };

  // Expose helpers to window
  window.checkAppVersion = checkAppVersion;
  window.showUpdateBanner = showUpdateBanner;

  // On DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    checkAndHideInstallButtons();
    injectVersionBadges();
    checkAppVersion();
  });
})();
