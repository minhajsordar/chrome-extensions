// Minimal content script for wafid.com
function isOnWafid() {
  const host = location.hostname.toLowerCase();
  return host === 'wafid.com' || host.endsWith('.wafid.com');
}

function setChooseMc() {
  const el = document.getElementById('choose-mc');
  if (!el) return { ok: false, reason: 'Element #choose-mc not found' };
  el.innerHTML = `
    <div class="fields-container mc" style="height: 148px;">
        <h4 class="ui header">Choose Medical Center</h4>
        <div class="two fields">
            <div class="field medical-center-field medical-center-field-js" style="display: block;">
                <div class="field">
                    <label style="opacity: 1;">
                        Medical Center
                    </label>
                    <select name="medical_center" id="id_medical_center" style="display: block;">
                        <option value="" selected="">Select Medical Center</option>
                        <option value="">Auto assign</option>
                        <option value=""> Rainbow Hearts Medical Center Ltd </option>
                        <option value=""> LAB QUEST LIMITED </option>
                        <option value=""> Gulf Medical Center </option>
                        <option value=""> Gulshan Medicare-Dhaka </option>
                        <option value=""> Nova Medical Center </option>
                        <option value=""> Pulse Medical Center </option>
                        <option value=""> Pushpo Clinic </option>
                        <option value=""> Saimon Medical Center </option>
                        <option value=""> Makkha Medical Center </option>
                        <option value=""> Medinova Medical Services Ltd </option>
                        <option value=""> Ibn Sina Medical Check Up </option>
                        <option value=""> International Health Center </option>
                    </select>
                </div>
                <span class="success-icon"><i class="check circle icon"></i> Success</span>
            </div>
        </div>
    </div>
`;

  return { ok: true };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'setChooseMc') {
    if (!isOnWafid()) {
      sendResponse({ ok: false, reason: 'Not on wafid.com' });
      return true;
    }
    try {
      sendResponse(setChooseMc());
    } catch (e) {
      sendResponse({ ok: false, reason: 'Failed to set content' });
    }
  }
  return true;
});
