document.addEventListener('deviceready', onDeviceReady, false);

let currentData = {
    masuk: [],
    keluar: []
};

function onDeviceReady() {
    console.log('Device is ready!');
    loadSavedData();
    setupEventListeners();
    
    // Set tanggal otomatis ke waktu sekarang
    document.getElementById('tanggal').value = getCurrentDateTime();
}

function setupEventListeners() {
    document.getElementById('dataForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveData();
    });
}

function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab:nth-child(${tabName === 'masuk' ? 1 : 2})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh data display
    loadSavedData();
}

function showForm() {
    document.getElementById('formModal').style.display = 'flex';
    document.getElementById('tanggal').value = getCurrentDateTime();
}

function hideForm() {
    document.getElementById('formModal').style.display = 'none';
    document.getElementById('dataForm').reset();
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function saveData() {
    const formData = {
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
    hideForm();
    loadSavedData();
}

function generateNomor(jenis) {
    const prefix = jenis === 'masuk' ? 'M' : 'K';
    const count = currentData[jenis].length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
}

function loadSavedData() {
    const saved = localStorage.getItem('appData');
    if (saved) {
        currentData = JSON.parse(saved);
    }
    
    renderData('masuk');
    renderData('keluar');
}

function renderData(jenis) {
    const container = document.getElementById(`${jenis}-data`);
    const data = currentData[jenis];
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📭 Tidak ada data ${jenis === 'masuk' ? 'masuk' : 'keluar'}</p>
                <p>Klik tombol + untuk menambah data</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.map(item => `
        <div class="table-row">
            <div class="col-no">${item.nomor}</div>
            <div class="col-nama">${item.nama}</div>
            <div class="col-tanggal">${formatTanggal(item.tanggal)}</div>
            <div class="col-keterangan">${item.keterangan || '-'}</div>
        </div>
    `).join('');
}

function formatTanggal(tanggalString) {
    const date = new Date(tanggalString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// === EXPORT FUNCTIONS ===
function showExportModal() {
    document.getElementById('exportModal').style.display = 'flex';
}

function hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function exportToCSV() {
    const allData = [...currentData.masuk, ...currentData.keluar];
    
    if (allData.length === 0) {
        alert('❌ Tidak ada data untuk diexport!');
        return;
    }
    
    const headers = ['Nomor', 'Jenis', 'Nama', 'Tanggal', 'Keterangan'];
    const csvContent = [
        headers.join(','),
        ...allData.map(item => [
            `"${item.nomor}"`,
            `"${item.jenis}"`,
            `"${item.nama}"`,
            `"${formatTanggal(item.tanggal)}"`,
            `"${item.keterangan || ''}"`
        ].join(','))
    ].join('\n');
    
    saveFile(csvContent, `data_export_${getCurrentDateString()}.csv`, 'text/csv');
    hideExportModal();
}

function exportToXLSX() {
    // Untuk XLSX, kita butuh library tambahan
    alert('📊 Fitur Export Excel membutuhkan library tambahan.\n\nInstall: cordova plugin add cordova-plugin-file');
    
    // Alternative: Save as CSV dengan extension .xlsx
    const allData = [...currentData.masuk, ...currentData.keluar];
    
    if (allData.length === 0) {
        alert('❌ Tidak ada data untuk diexport!');
        return;
    }
    
    const headers = ['Nomor', 'Jenis', 'Nama', 'Tanggal', 'Keterangan'];
    const csvContent = [
        headers.join(','),
        ...allData.map(item => [
            `"${item.nomor}"`,
            `"${item.jenis}"`,
            `"${item.nama}"`,
            `"${formatTanggal(item.tanggal)}"`,
            `"${item.keterangan || ''}"`
        ].join(','))
    ].join('\n');
    
    saveFile(csvContent, `data_export_${getCurrentDateString()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    hideExportModal();
}

function getCurrentDateString() {
    const now = new Date();
    return now.toISOString().slice(0, 10).replace(/-/g, '');
}

function saveFile(content, filename, mimeType) {
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.file) {
        // Save menggunakan cordova file plugin
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
            dir.getFile(filename, { create: true }, function(file) {
                file.createWriter(function(fileWriter) {
                    fileWriter.write(content);
                    alert(`✅ File berhasil disimpan: ${file.nativeURL}`);
                });
            });
        });
    } else {
        // Fallback: Download via browser
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`✅ File ${filename} berhasil diunduh!`);
    }
}

// Tambahkan event listener untuk export
document.addEventListener('DOMContentLoaded', function() {
    // Tambahkan button export di header
    const header = document.querySelector('.header');
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '💾 Export';
    exportBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        margin-top: 10px;
        cursor: pointer;
    `;
    exportBtn.onclick = showExportModal;
    header.appendChild(exportBtn);
});