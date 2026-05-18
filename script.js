// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const WEB_APP_URL = "https://script.google.com/macros/s/AKfyf...Isian_Deployment_Anda.../exec";

let allPelanggan = [];
let allInvoice = [];
let editMode = false;
let currentEditId = '';
let modalInvoiceInstance = null;

function toggleSidebar() {
  document.getElementById('sidebarMenu').classList.toggle('show');
}

function showPage(pageId){
  if(window.innerWidth < 992) {
    document.getElementById('sidebarMenu').classList.remove('show');
  }

  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active-page'));
  document.getElementById(pageId).classList.add('active-page');

  const buttons = document.querySelectorAll('.btn-sidebar');
  buttons.forEach(btn => btn.classList.remove('active'));

  /* Reset inputs */
  if(document.getElementById('searchPelanggan')) document.getElementById('searchPelanggan').value = '';
  if(document.getElementById('searchInvoice')) document.getElementById('searchInvoice').value = '';
  if(document.getElementById('invSearch')) document.getElementById('invSearch').value = '';
  if(document.getElementById('invNama')) document.getElementById('invNama').value = '';
  if(document.getElementById('invPaket')) document.getElementById('invPaket').value = '';
  if(document.getElementById('invPeriode')) document.getElementById('invPeriode').value = '';
  if(document.getElementById('invTanggal')) document.getElementById('invTanggal').value = '';

  document.querySelectorAll('#tabelPelangganBody tr').forEach(row => row.style.display = '');
  document.querySelectorAll('#tabelInvoiceBody tr').forEach(row => row.style.display = '');
  
  if(pageId == 'dashboard') document.getElementById('btn-dashboard').classList.add('active');
  else if(pageId == 'pelangganPage') {
    document.getElementById('btn-pelanggan').classList.add('active');
    loadDataPelanggan();
  }
  else if(pageId == 'invoicePage') document.getElementById('btn-invoice').classList.add('active');
  else if(pageId == 'dataInvoicePage') {
    document.getElementById('btn-data-invoice').classList.add('active');
    loadDataInvoice();
  }
}

/* =========================================
   INTEGRASI API FETCH KE GOOGLE APPS SCRIPT
========================================= */

function loadDataPelanggan(){
  fetch(`${WEB_APP_URL}?action=getPelanggan`)
    .then(res => res.json())
    .then(res => {
      if(res.status === "success") {
        allPelanggan = res.data;
        renderTable(allPelanggan);
        updateDataList(allPelanggan);
        updateTotalPelanggan(allPelanggan);
      } else {
        alert('Gagal mengambil data: ' + res.message);
      }
    })
    .catch(err => console.error('Error:', err));
}

function loadDataInvoice(){
  const tbody = document.getElementById("tabelInvoiceBody");
  tbody.innerHTML = '<tr><td colspan="9" class="text-center">Memuat data...</td></tr>';

  fetch(`${WEB_APP_URL}?action=getInvoice`)
    .then(res => res.json())
    .then(res => {
      if(res.status === "success"){
        allInvoice = res.data;
        if(allInvoice.length === 0){
          tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data invoice</td></tr>';
          return;
        }
        let html = '';
        allInvoice.forEach(inv => {
          html += `
            <tr>
              <td>${inv.NO_INVOICE}</td>
              <td>${inv.TANGGAL}</td>
              <td>${inv.ID}</td>
              <td>${inv.NAMA}</td>
              <td>${inv.PERIODE}</td>
              <td>${inv.PAKET}</td>
              <td>Rp. ${Number(inv.TAGIHAN).toLocaleString('id-ID')}</td>
              <td>${inv.PDF ? `<a href="${inv.PDF}" target="_blank" class="btn btn-sm btn-danger">PDF</a>` : '-'}</td>
              <td><button class="btn btn-sm btn-dark" onclick="hapusInvoice('${inv.NO_INVOICE}')">Hapus</button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
      }
    })
    .catch(err => {
      tbody.innerHTML = '<tr><td colspan="9" class="text-danger text-center">Gagal load data</td></tr>';
      console.error(err);
    });
}

function simpanData(){
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

  fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(formData)
  })
  .then(res => res.json())
  .then(res => {
    alert(res.message);
    bootstrap.Modal.getInstance(document.getElementById('modalPelanggan')).hide();
    loadDataPelanggan();
  })
  .catch(err => console.error('Error:', err));
}

function hapusPelanggan(id){
  if(!confirm('Hapus pelanggan?')) return;
  fetch(`${WEB_APP_URL}?action=deletePelanggan&id=${id}`)
    .then(res => res.json())
    .then(res => {
      alert(res.message);
      loadDataPelanggan();
    });
}

function hapusInvoice(noInvoice){
  if(!confirm('Yakin ingin menghapus invoice ini?')) return;
  fetch(`${WEB_APP_URL}?action=deleteInvoice&noInvoice=${noInvoice}`)
    .then(res => res.json())
    .then(res => {
      alert(res.message);
      loadDataInvoice();
    });
}

async function downloadInvoicePDF(){
  const element = document.getElementById('invoicePdfArea');
  const invoice = document.getElementById('pdfInvoice').innerText;
  const opt = {
    margin: 0,
    filename: invoice + '.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
  };

  try {
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);
    reader.onloadend = function(){
      const base64 = reader.result.split(',')[1];
      const data = {
        action: 'saveInvoice',
        noInvoice: document.getElementById('pdfInvoice').innerText,
        tanggal: document.getElementById('pdfTanggal').innerText,
        id: document.getElementById('pdfIdpel').innerText,
        nama: document.getElementById('pdfNama').innerText,
        periode: document.getElementById('pdfPeriode').innerText,
        paket: document.getElementById('pdfDeskripsi').innerText,
        tagihan: String(document.getElementById('pdfGrand').innerText).replace(/[^0-9]/g, ''),
        base64: base64
      };

      fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(res => {
        alert(res.message);
        loadDataInvoice();
        showPage('dataInvoicePage');
        html2pdf().set(opt).from(element).save();

        if(modalInvoiceInstance){
          modalInvoiceInstance.hide();
          modalInvoiceInstance = null;
        }
        document.querySelectorAll('.modal-backdrop').forEach(e => e.remove());
        document.body.classList.remove('modal-open');
      });
    };
  } catch(err) {
    alert('Gagal membuat PDF');
  }
}

function loadAsetGambar() {
  fetch(`${WEB_APP_URL}?action=getLogo`)
    .then(res => res.json())
    .then(res => document.getElementById('logoAccessnet').src = res.data);

  fetch(`${WEB_APP_URL}?action=getQris`)
    .then(res => res.json())
    .then(res => document.getElementById('qrisAccessnet').src = res.data);
}

/* =========================================
   FUNGSI INTERAL / LOGIKA INTERFACE DOM (Sama)
========================================= */
function renderTable(data){
  const tbody = document.getElementById('tabelPelangganBody');
  tbody.innerHTML = '';
  if(data.length == 0){
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Data kosong</td></tr>';
    return;
  }
  data.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.ID}</td><td>${p.NAMA}</td><td>${p.ALAMAT}</td><td>${p.PAKET} (Rp ${Number(p.HARGA_PAKET).toLocaleString("id-ID")})</td><td><div class="d-flex gap-1"><button class="btn btn-warning btn-sm" onclick="editPelanggan('${p.ID}')">Edit</button><button class="btn btn-danger btn-sm" onclick="hapusPelanggan('${p.ID}')">Hapus</button></div></td>`;
    tbody.appendChild(tr);
  });
}

function updateTotalPelanggan(data){
  let ppp = 0, hotspot = 0;
  data.forEach(p => {
    if(String(p.TIPE_LANGGANAN).toUpperCase() == 'PPP') ppp++;
    else if(String(p.TIPE_LANGGANAN).toUpperCase() == 'HOTSPOT') hotspot++;
  });
  document.getElementById('totalPPP').innerText = ppp;
  document.getElementById('totalHOTSPOT').innerText = hotspot;
}

function filterPelanggan(){
  const val = document.getElementById('searchPelanggan').value.toLowerCase();
  const filtered = allPelanggan.filter(p => p.NAMA.toLowerCase().includes(val) || p.ID.toString().includes(val));
  renderTable(filtered);
}

function filterInvoice(){
  const keyword = document.getElementById('searchInvoice').value.toLowerCase();
  document.querySelectorAll('#tabelInvoiceBody tr').forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

function updateDataList(data){
  const list = document.getElementById('listPelanggan');
  list.innerHTML = '';
  data.forEach(p => {
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

function openModal(){
  editMode = false; currentEditId = '';
  document.getElementById('modalTitle').innerText = 'Tambah Pelanggan';
  document.getElementById('formPelanggan').reset();
  document.getElementById('f_id').classList.remove('is-invalid');
  document.getElementById('idError').style.display = 'none';
  loadPaketByTipe();
  new bootstrap.Modal(document.getElementById('modalPelanggan')).show();
}

function pilihKodeNegara(){
  document.getElementById('f_kode_negara').value = document.getElementById('kode_negara_select').value;
}
function formatNomor(el){
  let val = el.value.replace(/\D/g,'');
  while(val.startsWith('0')) val = val.substring(1);
  el.value = val;
}
function hanyaAngka(e){
  const charCode = e.which ? e.which : e.keyCode;
  return !(charCode < 48 || charCode > 57);
}

function editPelanggan(id){
  editMode = true; currentEditId = id;
  const p = allPelanggan.find(x => x.ID == id);
  if(!p) return;

  document.getElementById('modalTitle').innerText = 'Edit Pelanggan';
  new bootstrap.Modal(document.getElementById('modalPelanggan')).show();

  document.getElementById('f_id').value = p.ID;
  document.getElementById('f_nama').value = p.NAMA;
  document.getElementById('f_alamat').value = p.ALAMAT;
  document.getElementById('f_tipe').value = p.TIPE_LANGGANAN || 'PPP';
	
  loadPaketByTipe();
  document.getElementById('f_paket').value = p.PAKET;
  pilihPaket();
  document.getElementById("f_harga").value = "Rp " + Number(String(p.HARGA_PAKET).replace(/[^0-9]/g,'')).toLocaleString("id-ID");
}

function pilihPaket(){
  const paket = document.getElementById('f_paket');
  const harga = paket.options[paket.selectedIndex]?.getAttribute('data-harga');
  document.getElementById('f_harga').value = harga ? 'Rp ' + parseInt(harga).toLocaleString('id-ID') : '';
}

function loadPaketByTipe(){
  const tipe = document.getElementById('f_tipe').value;
  const paketSelect = document.getElementById('f_paket');
  paketSelect.innerHTML = tipe == 'PPP' ? `
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
    <option value="PP-2Hp" data-harga="80000">PP-2Hp</option>` : `
    <option value="">-- Pilih Paket --</option>
    <option value="Hs-1hp" data-harga="50000">Hs-1hp</option>
    <option value="Hs-2hp" data-harga="80000">Hs-2hp</option>
    <option value="Keluarga" data-harga="0">Keluarga</option>`;
}

function cekIdPelanggan(){
  const input = document.getElementById('f_id');
  const error = document.getElementById('idError');
  const val = input.value.trim().toLowerCase();
  if(val === '') return false;

  const duplicate = allPelanggan.some(p => {
    if(editMode && p.ID == currentEditId) return false;
    return p.ID.toString().toLowerCase() == val;
  });

  if(duplicate){
    input.classList.add('is-invalid'); error.style.display = 'block'; return true;
  } else {
    input.classList.remove('is-invalid'); error.style.display = 'none'; return false;
  }
}

function prosesInvoice(){
  const raw = document.getElementById('invSearch').value;
  const id = raw.split(' - ')[0];
  const periode = document.getElementById('invPeriode').value;
  const tanggal = document.getElementById('invTanggal').value;

  if(!periode || !tanggal){ alert('Periode & Tanggal wajib diisi'); return; }
  const p = allPelanggan.find(x => x.ID == id);
  if(!p){ alert('Pilih pelanggan'); return; }

  const diskon = Number(document.getElementById('invDiskon').value || 0);
  const admin = Number(document.getElementById('invAdmin').value || 0);
  const invoice = 'INV0000' + Math.floor(1000 + Math.random() * 9000);
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

  modalInvoiceInstance = new bootstrap.Modal(document.getElementById('modalInvoicePdf'));
  modalInvoiceInstance.show();
}

window.onload = function(){
  new TomSelect("#kode_negara_select",{ create:false, placeholder:"Cari negara..." });
  showPage('dashboard');
  loadDataPelanggan();
  loadDataInvoice();
  loadAsetGambar();
};