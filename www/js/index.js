document.addEventListener('deviceready', onDeviceReady, false);

let currentData = { masuk: [], keluar: [] };
let darkMode = 'system'; // options: 'system', 'light', 'dark'

function onDeviceReady() {
    console.log('Device ready!');
    loadSavedData();
    setupEventListeners();
    applyDarkMode();
    document.getElementById('tanggal').value = getCurrentDateTime();
}

// ====================== Event Listeners ======================
function setupEventListeners() {
    document.getElementById('dataForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveData();
    });
}

// ====================== Tabs ======================
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab:nth-child(${tabName === 'masuk' ? 1 : 2})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    renderData(tabName);
}

// ====================== Modal ======================
function showForm() {
    document.getElementById('formModal').style.display = 'flex';
    document.getElementById('tanggal').value = getCurrentDateTime();
}
function hideForm() {
    document.getElementById('formModal').style.display = 'none';
    document.getElementById('dataForm').reset();
}

function showExportModal() {
    document.getElementById('exportModal').style.display = 'flex';
}
function hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

// ====================== Dark Mode ======================
function toggleDarkMode(mode) {
    darkMode = mode;
    applyDarkMode();
    localStorage.setItem('darkMode', darkMode);
}

function applyDarkMode() {
    if (darkMode === 'system') {
        darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.classList.toggle('dark', darkMode === 'dark');
}

// ====================== Date ======================
function getCurrentDateTime() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth()+1).padStart(2,'0');
    const dd = String(now.getDate()).padStart(2,'0');
    const hh = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
function getCurrentDateString() {
    return new Date().toISOString().slice(0,10).replace(/-/g,'');
}

// ====================== Storage ======================
function saveData() {
    const jenis = document.getElementById('jenisData').value;
    const data = {
        id: Date.now(),
        jenis,
        nama: document.getElementById('nama').value,
        tanggal: document.getElementById('tanggal').value,
        keterangan: document.getElementById('keterangan').value,
        nomor: generateNomor(jenis)
    };
    currentData[jenis].push(data);
    saveToFile();
    alert('✅ Data berhasil disimpan!');
    hideForm();
    renderData(jenis);
}

function generateNomor(jenis) {
    const prefix = jenis==='masuk'?'M':'K';
    const maxId = currentData[jenis].reduce((max, d)=>d.id>max?d.id:max,0);
    const count = currentData[jenis].length+1;
    return `${prefix}${String(count).padStart(4,'0')}`;
}

function saveToFile() {
    if (!cordova.plugins || !cordova.plugins.file) {
        localStorage.setItem('appData', JSON.stringify(currentData));
        return;
    }
    const content = JSON.stringify(currentData, null, 2);
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, dir=>{
        dir.getFile('data.json',{create:true}, file=>{
            file.createWriter(writer=>{
                writer.write(content);
            });
        });
    });
}

function loadSavedData() {
    if (cordova && cordova.plugins && cordova.plugins.file) {
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + 'data.json', fileEntry=>{
            fileEntry.file(file=>{
                const reader = new FileReader();
                reader.onloadend = function() {
                    currentData = JSON.parse(this.result || '{"masuk":[],"keluar":[]}');
                    renderData('masuk');
                    renderData('keluar');
                };
                reader.readAsText(file);
            });
        }, ()=>{
            // fallback: tidak ada file
            currentData = {masuk:[], keluar:[]};
        });
    } else {
        const saved = localStorage.getItem('appData');
        if(saved) currentData = JSON.parse(saved);
        renderData('masuk');
        renderData('keluar');
    }
}

// ====================== Render Table ======================
function renderData(jenis) {
    const container = document.getElementById(`${jenis}-data`);
    const data = currentData[jenis];
    
    if (!data.length) {
        container.innerHTML = `<div class="empty-state">📭 Tidak ada data ${jenis}<br>Tambah data menggunakan tombol +</div>`;
        return;
    }
    
    const rows = data.map((d,i)=>`
        <div class="table-row">
            <div class="col-no">${i+1}</div>
            <div class="col-nama">${d.nama}</div>
            <div class="col-tanggal">${formatTanggal(d.tanggal)}</div>
            <div class="col-keterangan">${d.keterangan||'-'}</div>
        </div>
    `).join('');
    
    container.innerHTML = rows;
}

function formatTanggal(t) {
    const date = new Date(t);
    return date.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric', hour:'2-digit', minute:'2-digit'});
}

// ====================== Export ======================
function exportToCSV() {
    const allData = [...currentData.masuk,...currentData.keluar];
    if(!allData.length){alert('❌ Tidak ada data'); return;}
    const headers = ['No','Jenis','Nama','Tanggal','Keterangan'];
    const csv = [
        headers.join(','),
        ...allData.map((d,i)=>[
            `"${i+1}"`,
            `"${d.jenis}"`,
            `"${d.nama}"`,
            `"${formatTanggal(d.tanggal)}"`,
            `"${d.keterangan||''}"`
        ].join(','))
    ].join('\n');
    saveFile(csv, `data_export_${getCurrentDateString()}.csv`, 'text/csv');
}

function exportToXLSX() {
    alert('📊 XLSX memerlukan library tambahan (SheetJS). Saat ini disimpan sebagai CSV.');
    exportToCSV();
}

function saveFile(content, filename, mimeType) {
    if(cordova && cordova.plugins && cordova.plugins.file){
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, dir=>{
            dir.getFile(filename,{create:true}, file=>{
                file.createWriter(writer=>{
                    writer.write(content);
                    alert(`✅ File tersimpan: ${file.nativeURL}`);
                });
            });
        });
    } else {
        const blob = new Blob([content],{type:mimeType});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        alert(`✅ File ${filename} berhasil diunduh!`);
    }
}

// ====================== DOMContentLoaded ======================
document.addEventListener('DOMContentLoaded',()=>{
    // export button
    const header = document.querySelector('.header');
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '💾 Export';
    exportBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border:1px solid rgba(255,255,255,0.3);
        color:white; padding:8px 15px; border-radius:20px; margin-top:10px; cursor:pointer;
    `;
    exportBtn.onclick = showExportModal;
    header.appendChild(exportBtn);
    
    // dark mode toggle
    const darkBtn = document.createElement('button');
    darkBtn.innerHTML = '🌓 Mode';
    darkBtn.style.cssText = exportBtn.style.cssText;
    darkBtn.onclick = ()=>{
        darkMode = (darkMode==='light')?'dark':'light';
        toggleDarkMode(darkMode);
    };
    header.appendChild(darkBtn);
});
