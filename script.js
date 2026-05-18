/* ==========================================================================
   ALAMAT WEB APP GOOGLE (PASTIKAN COCOK DENGAN URL DEPLOYMENT ANDA)
   ========================================================================== */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyJFt7mbDqRc2zh8fdE-dEgpq2syC3fWg4Hx6z0O7Xovj8V8HrYgJoE3Qpu3HuAArsw/exec";

let allPelanggan = [];
let allInvoice = [];
let editMode = false;
let currentEditId = '';
let modalInvoiceInstance = null;

/* =========================
   TOGGLE SIDEBAR (MOBILE)
========================= */
function toggleSidebar() {
  document.getElementById('sidebarMenu').classList.toggle('show');
}

/* =========================
   PINDAH HALAMAN
========================= */
function showPage(pageId){
  if(window.innerWidth < 992) {
    document.getElementById('sidebarMenu').classList.remove('show');
  }

  const pages = document.querySelectorAll('.page');
  pages.forEach(function(page){
    page.classList.remove('active-page');
  });

  document.getElementById(pageId).classList.add('active-page');

  const buttons = document.querySelectorAll('.btn-sidebar');
  buttons.forEach(function(btn){
    btn.classList.remove('active');
  });

  /* RESET INPUT */
  if(document.getElementById('searchPelanggan')) document.getElementById('searchPelanggan').value = '';
  if(document.getElementById('searchInvoice')) document.getElementById('searchInvoice').value = '';
  if(document.getElementById('invSearch')) document.getElementById('invSearch').value = '';
  if(document.getElementById('invNama')) document.getElementById('invNama').value = '';
  if(document.getElementById('invPaket')) document.getElementById('invPaket').value = '';
  if(document.getElementById('invPeriode')) document.getElementById('invPeriode').value = '';
  if(document.getElementById('invTanggal')) document.getElementById('invTanggal').value = '';

  document.querySelectorAll('#tabelPelangganBody tr').forEach(function(row){ row.style.display = ''; });
  document.querySelectorAll('#tabelInvoiceBody tr').forEach(function(row){ row.style.display = ''; });
  
  if(pageId == 'dashboard'){
    document.getElementById('btn-dashboard').classList.add('active');
  }
  else if(pageId == 'pelangganPage'){
    document.getElementById('btn-pelanggan').classList.add('active');
    loadDataPelanggan();
  }
  else if(pageId == 'invoicePage'){
    document.getElementById('btn-invoice').classList.add('active');
  }
  else if(pageId == 'dataInvoicePage'){
    document.getElementById('btn-data-invoice').classList.add('active');
    loadDataInvoice();
  }
}

/* =========================
   LOAD DATA PELANGGAN
========================= */
async function loadDataPelanggan(){
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getPelanggan`);
    const result = await response.json();
    if(result.status === "success"){
      allPelanggan = result.data;
      renderTable(allPelanggan);
      updateDataList(allPelanggan);
      updateTotalPelanggan(allPelanggan);
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert('Gagal mengambil data pelanggan (CORS/Network error)');
  }
}

/* =========================
   RENDER TABLE PELANGGAN
========================= */
function renderTable(data){
  const tbody = document.getElementById('tabelPelangganBody');
  tbody.innerHTML = '';

  if(data.length == 0){
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Data kosong</td></tr>';
    return;
  }

  data.forEach(function(p){
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + p.ID + '</td>' +
      '<td>' + p.NAMA + '</td>' +
      '<td>' + p.ALAMAT + '</td>' +
      '<td>' + p.PAKET + ' (Rp ' + Number(p.HARGA_PAKET).toLocaleString("id-ID") + ')</td>' +
      '<td>' +
        '<div class="d-flex gap-1">' +
          '<button class="btn btn-warning btn-sm" onclick="editPelanggan(\'' + p.ID + '\')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="hapusPelanggan(\'' + p.ID + '\')">Hapus</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/* =========================
   UPDATE TOTAL PELANGGAN
========================= */
function updateTotalPelanggan(data){
  let totalPPP = 0;
  let totalHOTSPOT = 0;

  data.forEach(function(p){
    if(String(p.TIPE_LANGGANAN).toUpperCase() == 'PPP'){
      totalPPP++;
    }
    else if(String(p.TIPE_LANGGANAN).toUpperCase() == 'HOTSPOT'){
      totalHOTSPOT++;
    }
  });

  document.getElementById('totalPPP').innerText = totalPPP;
  document.getElementById('totalHOTSPOT').innerText = totalHOTSPOT;
}

/* =========================
   SEARCH FILTER
========================= */
function filterPelanggan(){
  const val = document.getElementById('searchPelanggan').value.toLowerCase();
  const filtered = allPelanggan.filter(function(p){
      return (p.NAMA.toLowerCase().includes(val) || p.ID.toString().includes(val));
  });
  renderTable(filtered);
}

function filterInvoice(){
  const keyword = document.getElementById('searchInvoice').value.toLowerCase();
  const rows = document.querySelectorAll('#tabelInvoiceBody tr');

  rows.forEach(function(row){
    const text = row.innerText.toLowerCase();
    if(text.includes(keyword)){
      row.style.display = '';
    }else{
      row.style.display = 'none';
    }
  });
}

/* =========================
   AUTOCOMPLETE INVOICE
========================= */
function updateDataList(data){
  const list = document.getElementById('listPelanggan');
  list.innerHTML = '';

  data.forEach(function(p){
    const opt = document.createElement('option');
    opt.value = p.ID + ' - ' + p.NAMA;
    list.appendChild(opt);
  });
}

function isiOtomatisInvoice(val){
  const id = val.split(' - ')[0];
  const p = allPelanggan.find(x => x.ID == id);
  if(!p) return;

  document.getElementById('invNama').value = p.NAMA;
  document.getElementById('invPaket').value = p.PAKET + ' - ' + p.HARGA_PAKET;
}

/* =========================
   MODAL PELANGGAN MANAGEMENT
========================= */
function openModal(){
  editMode = false;
  currentEditId = '';

  document.getElementById('modalTitle').innerText = 'Tambah Pelanggan';
  document.getElementById('formPelanggan').reset();
  document.getElementById('f_id').classList.remove('is-invalid');
  document.getElementById('idError').style.display = 'none';
  document.getElementById('kode_negara_select').value = '62';
  document.getElementById('f_kode_negara').value = '62';
  
  loadPaketByTipe();

  if(document.getElementById('kode_negara_select').tomselect){
    document.getElementById('kode_negara_select').tomselect.setValue('62');
  }

  const modal = new bootstrap.Modal(document.getElementById('modalPelanggan'));
  modal.show();
}

/* =========================
   SIMPAN PELANGGAN (POST)
========================= */
async function simpanData(){
   if(cekIdPelanggan()){
     alert('ID sudah digunakan');
     return;
  }

  const formData = {
    action: 'savePelanggan',
    ID: document.getElementById('f_id').value,
    NAMA: document.getElementById('f_nama').value,
    ALAMAT: document.getElementById('f_alamat').value,
    NO_HP: document.getElementById('f_kode_negara').value + document.getElementById('f_hp').value,
    PAKET: document.getElementById('f_paket').value,
    HARGA_PAKET: document.getElementById('f_harga').value,
    TIPE_LANGGANAN: document.getElementById('f_tipe').value
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    if(result.status === "success"){
      alert(result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalPelanggan')).hide();
      loadDataPelanggan();
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch(err){
    console.error(err);
    alert("Error jaringan/CORS gagal mengirim data");
  }
}

function pilihKodeNegara(){
  const kode = document.getElementById('kode_negara_select').value;
  document.getElementById('f_kode_negara').value = kode;
}

function formatNomor(el){
  let value = el.value.replace(/\D/g,'');
  while(value.startsWith('0')){
    value = value.substring(1);
  }
  el.value = value;
}

function hanyaAngka(e){
  const charCode = e.which ? e.which : e.keyCode;
  if(charCode < 48 || charCode > 57){
    return false;
  }
  return true;
}

/* =========================
   EDIT PELANGGAN UI
========================= */
function editPelanggan(id){
  editMode = true;
  currentEditId = id;
  const p = allPelanggan.find(x => x.ID == id);
  if(!p) return;

  document.getElementById('modalTitle').innerText = 'Edit Pelanggan';
  const modal = new bootstrap.Modal(document.getElementById('modalPelanggan'));
  modal.show();

  document.getElementById('f_id').value = p.ID;
  document.getElementById('f_nama').value = p.NAMA;
  document.getElementById('f_alamat').value = p.ALAMAT;
  document.getElementById('f_tipe').value = p.TIPE_LANGGANAN || 'PPP';
	
  loadPaketByTipe();
  document.getElementById('f_paket').value = p.PAKET;
  pilihPaket();
  
  document.getElementById("f_harga").value = "Rp " + Number(String(p.HARGA_PAKET).replace(/[^0-9]/g,'')).toLocaleString("id-ID");

  let fullHp = p.NO_HP.toString();
  let kodeNegara = "62";
  let nomor = fullHp;

  if(fullHp.startsWith("62")){
    kodeNegara = "62";
    nomor = fullHp.substring(2);
  }

  document.getElementById('kode_negara_select').value = kodeNegara;
  document.getElementById('f_kode_negara').value = kodeNegara;

  if(document.getElementById('kode_negara_select').tomselect){
    document.getElementById('kode_negara_select').tomselect.setValue(kodeNegara);
  }
  document.getElementById('f_hp').value = nomor;
}

/* =========================
   HAPUS PELANGGAN
========================= */
async function hapusPelanggan(id){
  if(!confirm('Hapus pelanggan?')) return;
  try {
    const response = await fetch(`${WEB_APP_URL}?action=deletePelanggan&id=${id}`);
    const result = await response.json();
    if(result.status === "success"){
      alert(result.message);
      loadDataPelanggan();
    } else {
      alert("Gagal hapus: " + result.message);
    }
  } catch(err){
    console.error(err);
    alert("Gagal koneksi server untuk menghapus");
  }
}

/* =========================
   LOAD DATA INVOICE
========================= */
async function loadDataInvoice(){
  const tbody = document.getElementById("tabelInvoiceBody");
  tbody.innerHTML = '<tr><td colspan="9" class="text-center">Memuat data...</td></tr>';

  try {
    const response = await fetch(`${WEB_APP_URL}?action=getInvoice`);
    const result = await response.json();
    
    if(result.status === "success"){
      const data = result.data;
      if(!data || data.length === 0){
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data invoice</td></tr>';
        return;
      }

      let html = '';
      data.forEach(function(inv){
        html += `
          <tr>
            <td>${inv.NO_INVOICE}</td>
            <td>${inv.TANGGAL}</td>
            <td>${inv.ID}</td>
            <td>${inv.NAMA}</td>
            <td>${inv.PERIODE}</td>
            <td>${inv.PAKET}</td>
            <td>Rp. ${Number(inv.TAGIHAN).toLocaleString('id-ID')}</td>
            <td>
              ${inv.PDF ? `<a href="${inv.PDF}" target="_blank" class="btn btn-sm btn-danger">PDF</a>` : '-'}
            </td>
            <td>
              <button class="btn btn-sm btn-dark" onclick="hapusInvoice('${inv.NO_INVOICE}')">Hapus</button>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    } else {
      tbody.innerHTML = `<tr><td colspan="9" class="text-danger text-center">Gagal: ${result.message}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-danger text-center">Gagal load data (CORS/Network Error)</td></tr>';
    console.error(err);
  }
}

/* =========================
   HAPUS INVOICE
========================= */
async function hapusInvoice(noInvoice){
  if(!confirm('Yakin ingin menghapus invoice ini?')) return;

  try {
    const response = await fetch(`${WEB_APP_URL}?action=deleteInvoice&noInvoice=${noInvoice}`);
    const result = await response.json();
    if(result.status === "success"){
      alert(result.message);
      loadDataInvoice();
    } else {
      alert("Gagal menghapus: " + result.message);
    }
  } catch(err){
    alert('Gagal menghapus karena gangguan koneksi');
    console.error(err);
  }
}

/* PILIH PAKET */
function pilihPaket(){
  const paket = document.getElementById('f_paket');
  const selected = paket.options[paket.selectedIndex];
  const harga = selected.getAttribute('data-harga');

  if(harga){
    document.getElementById('f_harga').value = 'Rp ' + parseInt(harga).toLocaleString('id-ID');
  }else{
    document.getElementById('f_harga').value = '';
  }
}

/* BIND DATA PAKET BERDASARKAN TIPE */
function loadPaketByTipe(){
  const tipe = document.getElementById('f_tipe').value;
  const paketSelect = document.getElementById('f_paket');
  let options = '';

  if(tipe == 'PPP'){
    options = `
      <option value="">-- Pilih Paket --</option>
      <option value="ACCESSNet" data-harga="0">ACCESSNet</option>
      <option value="200Mb" data-harga="1100000">200Mb</option>
      <option value="PP-50M" data-harga="650000">PP-50M</option>
      <option value="PP-30M" data-harga="330000">PP-30M</option>
      <option value="PP-20M" data-harga="300000">PP-20M</option>
      <option value="PP-15M" data-harga="185000">PP-15M</option>
      <option value="PP-12M" data-harga="165000">PP-12M</option>
      <option value="PP-8M" data-harga="145000">PP-8M</option>
      <option value="PP-7M" data-harga="130000">PP-7M</option>
      <option value="PP-5M" data-harga="110000">PP-5M</option>
      <option value="PP-STB" data-harga="185000">PP-STB</option>
      <option value="PP-1Hp" data-harga="50000">PP-1Hp</option>
      <option value="PP-2Hp" data-harga="80000">PP-2Hp</option>
    `;
  }
  else if(tipe == 'HOTSPOT'){
    options = `
      <option value="">-- Pilih Paket --</option>
      <option value="Hs-1hp" data-harga="50000">Hs-1hp</option>
      <option value="Hs-2hp" data-harga="80000">Hs-2hp</option>
      <option value="Keluarga" data-harga="0">Keluarga</option>
    `;
  }

  paketSelect.innerHTML = options;
  document.getElementById('f_harga').value = '';
}

/* CEK ID DUPLIKAT */
function cekIdPelanggan(){
  const input = document.getElementById('f_id');
  const error = document.getElementById('idError');
  const val = input.value.trim().toLowerCase();

  if(val === ''){
    input.classList.remove('is-invalid');
    error.style.display = 'none';
    return false;
  }

  const duplicate = allPelanggan.some(function(p){
      if(editMode && p.ID == currentEditId) return false;
      return p.ID.toString().toLowerCase() == val;
  });

  if(duplicate){
    input.classList.add('is-invalid');
    error.style.display = 'block';
    return true;
  }else{
    input.classList.remove('is-invalid');
    error.style.display = 'none';
    return false;
  }
}

/* =========================
   PROSES GENERATE INVOICE
========================= */
function prosesInvoice(){
  const raw = document.getElementById('invSearch').value;
  const id = raw.split(' - ')[0];
  const periode = document.getElementById('invPeriode').value;
  const tanggal = document.getElementById('invTanggal').value;

  if(!periode){ alert('Periode Tagihan wajib diisi'); return; }
  if(!tanggal){ alert('Tanggal Bayar wajib diisi'); return; }

  const diskon = Number(document.getElementById('invDiskon').value || 0);
  const admin = Number(document.getElementById('invAdmin').value || 0);
  const p = allPelanggan.find(x => x.ID == id);

  if(!p){ alert('Pilih pelanggan'); return; }

  const random4Digit = Math.floor(1000 + Math.random() * 9000);
  const invoice = 'INV0000' + random4Digit;
  const subtotal = Number(String(p.HARGA_PAKET).replace(/[^0-9]/g,''));
  const grand = subtotal - diskon + admin;

  document.getElementById('pdfIdpel').innerText = p.ID;
  document.getElementById('pdfNama').innerText = p.NAMA;
  document.getElementById('pdfAlamat').innerText = p.ALAMAT;
  document.getElementById('pdfHp').innerText = p.NO_HP;
  document.getElementById('pdfInvoice').innerText = invoice;
  document.getElementById('pdfPeriode').innerText = periode;
  document.getElementById('pdfTanggal').innerText = tanggal;
  document.getElementById('pdfDeskripsi').innerText = 'Layanan Internet - Paket : ' + p.PAKET;

  document.getElementById('pdfHarga').innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
  document.getElementById('pdfSubtotal').innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
  document.getElementById('pdfSub').innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
  document.getElementById('pdfDiskon').innerText = '- Rp ' + diskon.toLocaleString('id-ID');
  document.getElementById('pdfAdmin').innerText = 'Rp ' + admin.toLocaleString('id-ID');
  document.getElementById('pdfGrand').innerText = 'Rp ' + grand.toLocaleString('id-ID');

  const modalEl = document.getElementById('modalInvoicePdf');
  modalInvoiceInstance = new bootstrap.Modal(modalEl);
  modalInvoiceInstance.show();
}

/* =========================
   DOWNLOAD PDF & UPLOAD KE GOOGLE DRIVE
========================= */
async function downloadInvoicePDF(){
  const element = document.getElementById('invoicePdfArea');
  const invoice = document.getElementById('pdfInvoice').innerText;

  const opt = {
    margin:0,
    filename: invoice + '.pdf',
    image:{ type:'jpeg', quality:1 },
    html2canvas:{ scale:2, useCORS:true },
    jsPDF:{ unit:'px', format:[794,1123], orientation:'portrait' }
  };

  try{
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);

    reader.onloadend = async function(){
      const base64 = reader.result.split(',')[1];
      const data = {
        action: 'saveInvoice',
        noInvoice: document.getElementById('pdfInvoice').innerText,
        tanggal: document.getElementById('pdfTanggal').innerText,
        id: document.getElementById('pdfIdpel').innerText,
        nama: document.getElementById('pdfNama').innerText,
        periode: document.getElementById('pdfPeriode').innerText,
        paket: document.getElementById('pdfDeskripsi').innerText,
        tagihan: String(Number(document.getElementById('pdfGrand').innerText.replace(/[^0-9]/g,''))),
        base64: base64
      };

      try {
        const response = await fetch(WEB_APP_URL, {
          method: "POST",
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if(result.status === "success"){
          alert('Invoice berhasil disimpan');
          loadDataInvoice();
          showPage('dataInvoicePage');

          html2pdf().set(opt).from(element).save();
          if(result.pdfUrl) window.open(result.pdfUrl,'_blank');

          if(modalInvoiceInstance){
            modalInvoiceInstance.hide();
            modalInvoiceInstance = null;
          }
          document.querySelectorAll('.modal-backdrop').forEach(e => e.remove());
          document.body.classList.remove('modal-open');
        } else {
          alert('Gagal simpan ke drive: ' + result.message);
        }
      } catch(e) {
        console.error(e);
        alert('Gagal upload data invoice ke server');
      }
    };
  }catch(err){
    console.log(err);
    alert('Gagal generate PDF');
  }
}

/* =========================
   LOAD ASSET MEDIA IMAGE FROM DRIVE
========================= */
async function loadMedia(){
  try {
    fetch(`${WEB_APP_URL}?action=getLogo`)
      .then(res => res.json())
      .then(res => { if(res.status === "success") document.getElementById('logoAccessnet').src = res.data; });

    fetch(`${WEB_APP_URL}?action=getQris`)
      .then(res => res.json())
      .then(res => { if(res.status === "success") document.getElementById('qrisAccessnet').src = res.data; });
  } catch(e){
    console.error("Gagal memuat media", e);
  }
}

/* =========================
   INISIALISASI AWAL APLIKASI
========================= */
window.onload = function(){
  if(document.getElementById('kode_negara_select')){
    window.negaraSelect = new TomSelect("#kode_negara_select",{
      create:false,
      sortField:{ field:"text", direction:"asc" },
      placeholder:"Cari negara..."
    });
  }

  showPage('dashboard');
  loadDataPelanggan();
  loadDataInvoice();
  loadMedia();
};
