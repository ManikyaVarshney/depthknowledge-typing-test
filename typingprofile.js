/* typingprofile.js
  DepthKnowledge - Simple local profile system for typing test
  - Save multiple profiles to localStorage
  - Generate unique ID (DKT-XXXXX)
  - Autofill by ID
  - Expose a simple widget inside a container with id="dk-profile"
  Usage:
    1) Upload this file to GitHub at repo root.
    2) Include in Blogger with jsdelivr CDN:
       <script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO/typingprofile.js"></script>
    3) Paste the HTML snippet (provided below) into Blogger page.
*/

(function () {
  const STORAGE_KEY = 'dk_profiles_v1';

  // Utilities
  function uid() {
    // DKT-XXXXX random 5 digits, but ensure uniqueness by checking existing profiles
    const d = JSON.floor || Math.floor;
    const rand = () => String(Math.floor(Math.random() * 90000) + 10000);
    let id;
    const profiles = loadProfiles();
    do { id = 'DKT-' + rand(); } while (profiles.some(p => p.id === id));
    return id;
  }

  // Slightly safer uid (keeps function integrity)
  function generateId() {
    const rand = () => String(Math.floor(Math.random() * 90000) + 10000);
    let id;
    const profiles = loadProfiles();
    do { id = 'DKT-' + rand(); } while (profiles.some(p => p.id === id));
    return id;
  }

  function nowString() {
    return new Date().toLocaleString();
  }

  function loadProfiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('dk: failed parsing profiles', e);
      return [];
    }
  }

  function saveProfiles(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
  }

  function addProfile(profile) {
    const arr = loadProfiles();
    arr.push(profile);
    saveProfiles(arr);
  }

  function updateProfile(id, newData) {
    const arr = loadProfiles();
    const idx = arr.findIndex(p => p.id === id);
    if (idx >= 0) {
      arr[idx] = Object.assign({}, arr[idx], newData, { updatedAt: nowString() });
      saveProfiles(arr);
    }
  }

  function deleteProfile(id) {
    const arr = loadProfiles().filter(p => p.id !== id);
    saveProfiles(arr);
  }

  // Render functions
  function render(container) {
    container.innerHTML = ''; // start fresh
    container.classList.add('dk-profile');

    // Header card: create profile form
    const card = document.createElement('div'); card.className = 'dk-card';
    card.innerHTML = `
      <div class="dk-h">Create / Edit Profile</div>
      <div class="dk-muted">First time? fill details to generate a unique ID. Next time, just enter ID to auto-fill.</div>
      <div style="height:8px"></div>
      <div class="dk-row">
        <input class="dk-input" id="dk_name" placeholder="Full name (required)" />
        <input class="dk-input" id="dk_email" placeholder="Email (optional)" />
      </div>
      <div style="height:8px"></div>
      <div class="dk-row">
        <input class="dk-input" id="dk_country" placeholder="Country (optional)" />
        <input class="dk-input" id="dk_dob" placeholder="DOB (optional)" />
        <select id="dk_gender" class="dk-input">
          <option value="">Gender (optional)</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      <div style="height:8px"></div>
      <div class="dk-row">
        <button id="dk_create" class="dk-btn primary">Create Profile & Get ID</button>
        <button id="dk_update" class="dk-btn ghost">Update Selected</button>
        <button id="dk_clear" class="dk-btn ghost">Clear</button>
        <div style="margin-left:auto" class="dk-small dk-muted">Saved locally on this device only</div>
      </div>
      <div style="height:6px"></div>
      <div id="dk_message" class="dk-small"></div>
    `;
    container.appendChild(card);

    // ID quick lookup card
    const findCard = document.createElement('div'); findCard.className = 'dk-card';
    findCard.innerHTML = `
      <div class="dk-h">Quick Access by ID</div>
      <div class="dk-row">
        <input class="dk-input" id="dk_lookup_id" placeholder="Enter ID (e.g. DKT-12345)" />
        <button id="dk_lookup_btn" class="dk-btn ghost">Lookup</button>
        <button id="dk_fill_btn" class="dk-btn">Auto Fill Last</button>
      </div>
      <div style="height:6px"></div>
      <div class="dk-row">
        <div><strong>Your ID:</strong> <span id="dk_current_id" class="dk-id">—</span></div>
        <div style="margin-left:auto"><span class="dk-badge">Local Only</span></div>
      </div>
    `;
    container.appendChild(findCard);

    // Profiles list
    const listCard = document.createElement('div'); listCard.className = 'dk-card';
    listCard.innerHTML = `<div class="dk-h">Saved Profiles</div><div class="dk-muted">Tap an item to autofill or manage it.</div><div class="dk-list" id="dk_profiles_list"></div>`;
    container.appendChild(listCard);

    // Footer utilities (export/import/clear)
    const bottom = document.createElement('div'); bottom.className = 'dk-card';
    bottom.innerHTML = `
      <div class="dk-row">
        <button id="dk_export" class="dk-btn ghost">Export Profiles (JSON)</button>
        <button id="dk_import" class="dk-btn ghost">Import JSON</button>
        <button id="dk_clear_all" class="dk-btn ghost">Clear All Profiles</button>
        <div style="margin-left:auto" class="dk-small dk-muted">You can save JSON as backup</div>
      </div>
      <div style="height:6px"></div>
      <textarea id="dk_import_area" placeholder='Paste JSON here to import' style="width:100%;min-height:60px;border-radius:8px;border:1px solid #e6e9ef;padding:8px"></textarea>
    `;
    container.appendChild(bottom);

    // Hook up events after DOM inserted
    bind(container);
    refreshProfilesList(container);
    updateCurrentIdDisplay(container);
  }

  function bind(container) {
    const nameIn = container.querySelector('#dk_name');
    const emailIn = container.querySelector('#dk_email');
    const countryIn = container.querySelector('#dk_country');
    const dobIn = container.querySelector('#dk_dob');
    const genderIn = container.querySelector('#dk_gender');
    const createBtn = container.querySelector('#dk_create');
    const updateBtn = container.querySelector('#dk_update');
    const clearBtn = container.querySelector('#dk_clear');
    const message = container.querySelector('#dk_message');
    const lookupIn = container.querySelector('#dk_lookup_id');
    const lookupBtn = container.querySelector('#dk_lookup_btn');
    const fillLastBtn = container.querySelector('#dk_fill_btn');
    const profilesList = container.querySelector('#dk_profiles_list');
    const currentId = container.querySelector('#dk_current_id');
    const exportBtn = container.querySelector('#dk_export');
    const importBtn = container.querySelector('#dk_import');
    const clearAllBtn = container.querySelector('#dk_clear_all');
    const importArea = container.querySelector('#dk_import_area');

    function showMessage(txt, isError) {
      message.textContent = txt || '';
      message.style.color = isError ? '#bf1650' : '#0b6e4f';
      setTimeout(()=>{ message.textContent=''; }, 3500);
    }

    createBtn.addEventListener('click', ()=>{
      const name = nameIn.value.trim();
      if(!name) { showMessage('Name is required', true); nameIn.focus(); return; }
      const email = emailIn.value.trim();
      const country = countryIn.value.trim();
      const dob = dobIn.value.trim();
      const gender = genderIn.value;
      const id = generateId();
      const profile = { id, name, email, country, dob, gender, createdAt: nowString(), updatedAt: nowString() };
      addProfile(profile);
      refreshProfilesList(container);
      // show id in UI
      container.querySelector('#dk_current_id').textContent = id;
      showMessage('Profile created: ' + id);
      // optionally clear form
      // nameIn.value = ''; emailIn.value=''; countryIn.value=''; dobIn.value=''; genderIn.value='';
    });

    updateBtn.addEventListener('click', ()=>{
      const id = container.querySelector('#dk_current_id').textContent;
      if(!id || id === '—') { showMessage('No profile selected to update', true); return; }
      const name = nameIn.value.trim();
      if(!name) { showMessage('Name is required', true); nameIn.focus(); return; }
      updateProfile(id, { name: name, email: emailIn.value.trim(), country: countryIn.value.trim(), dob: dobIn.value.trim(), gender: genderIn.value, updatedAt: nowString() });
      refreshProfilesList(container);
      showMessage('Profile updated: ' + id);
    });

    clearBtn.addEventListener('click', ()=>{
      nameIn.value = ''; emailIn.value=''; countryIn.value=''; dobIn.value=''; genderIn.value='';
      container.querySelector('#dk_current_id').textContent = '—';
    });

    lookupBtn.addEventListener('click', ()=>{
      const q = lookupIn.value.trim();
      if(!q) { showMessage('Enter an ID to lookup', true); lookupIn.focus(); return; }
      const arr = loadProfiles();
      const found = arr.find(p => p.id.toLowerCase() === q.toLowerCase());
      if(!found) { showMessage('ID not found on this device', true); return; }
      // fill form
      nameIn.value = found.name || '';
      emailIn.value = found.email || '';
      countryIn.value = found.country || '';
      dobIn.value = found.dob || '';
      genderIn.value = found.gender || '';
      container.querySelector('#dk_current_id').textContent = found.id;
      showMessage('Profile loaded: ' + found.id);
    });

    fillLastBtn.addEventListener('click', ()=>{
      const arr = loadProfiles();
      if(arr.length === 0) { showMessage('No saved profiles yet', true); return; }
      const last = arr[arr.length - 1];
      lookupIn.value = last.id;
      lookupBtn.click();
    });

    // list click handlers (delegation)
    profilesList.addEventListener('click', (ev)=>{
      const row = ev.target.closest('.dk-item');
      if(!row) return;
      const id = row.getAttribute('data-id');
      if(!id) return;
      const profiles = loadProfiles();
      const p = profiles.find(x => x.id === id);
      if(!p) return;
      // if clicked on delete icon
      if(ev.target && ev.target.classList.contains('dk-delete')) {
        if(confirm('Delete profile ' + id + ' ?')) { deleteProfile(id); refreshProfilesList(container); showMessage('Deleted ' + id); container.querySelector('#dk_current_id').textContent = '—'; }
        return;
      }
      // default: fill
      nameIn.value = p.name || '';
      emailIn.value = p.email || '';
      countryIn.value = p.country || '';
      dobIn.value = p.dob || '';
      genderIn.value = p.gender || '';
      container.querySelector('#dk_current_id').textContent = p.id;
      showMessage('Loaded ' + p.id);
    });

    exportBtn.addEventListener('click', ()=>{
      const arr = loadProfiles();
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'dk-profiles.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', ()=>{
      const raw = importArea.value.trim();
      if(!raw) { showMessage('Paste JSON into the box to import', true); return; }
      try {
        const arr = JSON.parse(raw);
        if(!Array.isArray(arr)) throw new Error('Expected array of profiles');
        // Simple merge: keep unique ids, skip duplicates
        const existing = loadProfiles();
        const map = {};
        existing.forEach(p => map[p.id] = p);
        arr.forEach(p => {
          if(p && p.id) {
            if(!map[p.id]) existing.push(p);
          }
        });
        saveProfiles(existing);
        refreshProfilesList(container);
        showMessage('Imported ' + arr.length + ' profiles (duplicates skipped)');
      } catch (e) {
        console.error(e);
        showMessage('Invalid JSON: ' + e.message, true);
      }
    });

    clearAllBtn.addEventListener('click', ()=>{
      if(confirm('Clear ALL saved profiles on this device?')) {
        localStorage.removeItem(STORAGE_KEY);
        refreshProfilesList(container);
        showMessage('All profiles removed');
      }
    });

  } // bind

  function refreshProfilesList(container) {
    const listDiv = container.querySelector('#dk_profiles_list');
    listDiv.innerHTML = '';
    const arr = loadProfiles();
    if (arr.length === 0) {
      listDiv.innerHTML = '<div class="dk-small dk-muted">No profiles saved yet.</div>';
      return;
    }
    arr.slice().reverse().forEach(p => {
      const el = document.createElement('div');
      el.className = 'dk-item';
      el.setAttribute('data-id', p.id);
      el.innerHTML = `<div>
          <div style="font-weight:700">${escapeHtml(p.name)} <span class="dk-small dk-muted" style="margin-left:6px">${p.email?escapeHtml(p.email):''}</span></div>
          <div class="dk-small dk-muted">${p.country || ''} • ${p.createdAt || ''}</div>
        </div>
        <div class="dk-actions">
          <div class="dk-id">${p.id}</div>
          <div style="display:flex;gap:6px">
            <button class="dk-btn ghost dk-load">Load</button>
            <button class="dk-btn ghost dk-delete" title="Delete this profile">Del</button>
          </div>
        </div>`;
      listDiv.appendChild(el);
    });
  }

  // small HTML escape helper
  function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }

  // Initialize the widget in container with id 'dk-profile'
  function init() {
    // ensure container exists
    const container = document.getElementById('dk-profile');
    if (!container) {
      // Delay initialization if not found yet (in case script loaded early). Try again once DOM ready.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        console.warn('dk-profile container not found. Create <div id="dk-profile"></div> in your HTML.');
      }
      return;
    }
    // render UI
    render(container);
    // show last used id in UI if present
    const profiles = loadProfiles();
    if (profiles.length > 0) {
      const last = profiles[profiles.length - 1];
      container.querySelector('#dk_current_id').textContent = last.id;
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  // Expose a helper to get profile by id (so other scripts like typing test can fetch user details)
  window.DKProfiles = {
    getById: function (id) {
      const arr = loadProfiles();
      return arr.find(p => p.id === id) || null;
    },
    list: function () { return loadProfiles(); }
  };

})();
