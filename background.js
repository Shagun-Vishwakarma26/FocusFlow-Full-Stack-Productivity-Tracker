let currentDomain = null;
let startTime = Date.now();
let isIdle = false;

// 1. Idle Detection: Pause tracking if user walks away for 60 seconds
chrome.idle.setDetectionInterval(60); 
chrome.idle.onStateChanged.addListener((state) => {
    if (state !== "active") {
        isIdle = true;
        saveAndReset(); 
    } else {
        isIdle = false;
        startTime = Date.now();
    }
});

// 2. Tab Change Tracking
chrome.tabs.onActivated.addListener(handleTabChange);
chrome.tabs.onUpdated.addListener((id, change, tab) => {
    if (change.url && tab.active) handleTabChange();
});

async function handleTabChange() {
    if (isIdle) return;
    saveAndReset();
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('http')) {
        try {
            currentDomain = new URL(tab.url).hostname;
            startTime = Date.now();
        } catch (e) {
            currentDomain = null;
        }
    } else {
        currentDomain = null;
    }
}

// 3. Sync with Backend (your Node.js server)
function saveAndReset() {
    if (!currentDomain) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (duration > 1) {
        fetch('http://localhost:5000/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: currentDomain, duration: duration })
        }).catch(err => console.log("Server not reached:", err));
    }
}