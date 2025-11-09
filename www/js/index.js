document.addEventListener('deviceready', onDeviceReady, false);

let currentData = { masuk: [], keluar: [] };
let darkMode = localStorage.getItem('darkMode') || 'system';
let saveFolder = localStorage.getItem('saveFolder') || '';

function onDeviceReady() {
    loadSavedData();
    setupEventListeners();
    setDarkMode(darkMode);
    document.getElementById('tanggal').value = getCurrentDateTime();
}

function setupEventListeners() {
    document.getElementById('dataForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveData();
    });
}

// === TAB SWITCH ===
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab:nth-child(${tabName==='masuk'?1:2})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    loadSavedData();
}

// === FORM ===
function showForm() {document.getElementById('formModal').style.display='flex'; document.getElementById('tanggal').value=getCurrentDateTime();}
function hideForm() {document.getElementById('formModal').style.display='none'; document.getElementById('dataForm').reset();}

function getCurrentDateTime() {
    const now=new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function saveData() {
    const formData={
        id: Date.now(),
        jenis: document.getElementById('jenisData').value,
        nama: document.getElementById('nama').value,
        tanggal: document.getElementById('tanggal').value,
        keterangan: document.getElementById('keterangan').value,
        nomor: generateNomor(document.getElementById('jenisData').value)
    };
    currentData[formData.jenis].push(formData);
    localStorage.setItem('appData', JSON.stringify(currentData));
    alert('✅ Data berhasil disimpan!');
    hideForm(); loadSavedData();
}

function generateNomor(jenis) {return (jenis==='masuk'?'M':'K')+String(currentData[jenis].length).padStart(4,'0');}

// === LOAD & RENDER ===
function loadSavedData() {
    const saved=localStorage.getItem('appData');
    if(saved) currentData=JSON.parse(saved);
    renderData('masuk'); renderData('keluar');
}

function renderData(jenis) {
    const container=document.getElementById(`${jenis}-data`);
    const data=currentData[jenis];
    if(data.length===0){
        container.innerHTML=`<div class="empty-state">📭 Tidak ada data ${jenis==='masuk'?'masuk':'keluar'}<br>Klik tombol + untuk menambah data</div>`;
        return;
    }
    container.innerHTML=`<div class="table-header ${darkMode==='dark'?'dark':''}"><div class="col-no">No</div><div class="col-nama">Nama</div><div class="col-tanggal">Tanggal/Waktu</div><div class="col-keterangan">Keterangan</div></div>`+
        data.map((item,i)=>`<div class="table-row ${darkMode==='dark'?'dark':''}"><div class="col-no">${i+1}</div><div class="col-nama">${item.nama}</div><div class="col-tanggal">${formatTanggal(item.tanggal)}</div><div class="col-keterangan">${item.keterangan||'-'}</div></div>`).join('');
}

function formatTanggal(t) {const d=new Date(t);return d.toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}

// === DARK MODE ===
function toggleDarkMode() {
    darkMode=(darkMode==='dark')?'light':'dark';
    localStorage.setItem('darkMode', darkMode);
    setDarkMode(darkMode);
}

function setDarkMode(mode){
    if(mode==='system'){document.body.classList.remove('dark');}
    else if(mode==='dark'){document.body.classList.add('dark');}
    else{document.body.classList.remove('dark');}
}

// === EXPORT MODAL ===
function toggleExportModal(){document.getElementById('exportModal').style.display='flex'; document.getElementById('saveFolder').value=saveFolder;}
function hideExportModal(){document.getElementById('exportModal').style.display='none'; saveFolder=document.getElementById('saveFolder').value; localStorage.setItem('saveFolder',saveFolder);}

// === EXPORT FUNCTIONS ===
function exportToCSV(){
    const allData=[...currentData.masuk,...currentData.keluar];
    if(allData.length===0){alert('❌ Tidak ada data untuk diexport!'); return;}
    const headers=['No','Jenis','Nama','Tanggal','Keterangan'];
    const csvContent=[headers.join(','), ...allData.map((item,i)=>[i+1,item.jenis,item.nama,formatTanggal(item.tanggal),item.keterangan||''].join(','))].join('\n');
    saveFile(csvContent, `data_export_${getCurrentDateString()}.csv`, 'text/csv');
    hideExportModal();
}

function exportToXLSX(){
    alert('📊 XLSX fallback: file tetap CSV tapi berekstensi .xlsx');
    const allData=[...currentData.masuk,...currentData.keluar];
    if(allData.length===0){alert('❌ Tidak ada data untuk diexport!'); return;}
    const headers=['No','Jenis','Nama','Tanggal','Keterangan'];
    const csvContent=[headers.join(','), ...allData.map((item,i)=>[i+1,item.jenis,item.nama,formatTanggal(item.tanggal),item.keterangan||''].join(','))].join('\n');
    saveFile(csvContent, `data_export_${getCurrentDateString()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    hideExportModal();
}

function getCurrentDateString(){return new Date().toISOString().slice(0,10).replace(/-/g,'');}

// === SAVE FILE ===
function saveFile(content, filename, mimeType){
    if(typeof cordova!=='undefined' && cordova.plugins && cordova.plugins.file){
        // Permission Android
        if(cordova.plugins.permissions){
            cordova.plugins.permissions.requestPermission(cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE, function(status){
                if(!status.hasPermission){alert('❌ Izin storage ditolak'); return;}
                saveWithCordova(content, filename, mimeType);
            });
        } else saveWithCordova(content, filename, mimeType);
    } else {
        const blob=new Blob([content], {type:mimeType});
        const url=window.URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url; a.download=filename; a.click(); window.URL.revokeObjectURL(url);
        alert(`✅ File ${filename} berhasil diunduh!`);
    }
}

function saveWithCordova(content, filename, mimeType){
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory,function(dir){
        const folderPath = document.getElementById('saveFolder').value || '';
        dir.getDirectory(folderPath,{create:true}, function(subDir){
            subDir.getFile(filename,{create:true}, function(fileEntry){
                fileEntry.createWriter(function(writer){
                    writer.write(content);
                    alert(`✅ File berhasil disimpan: ${fileEntry.nativeURL}`);
                });
            });
        });
    });
        }
