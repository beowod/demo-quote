// public/script.js

const API_QUOTE    = '/api/quote';
const API_RESERVE  = '/api/reserve';
const API_CANCEL   = '/api/cancel';
const API_LOOKUP   = '/api/reservation';
const API_METRICS  = '/api/metrics/cancellations';
const app          = document.getElementById('app');
const BRANCH_DISPLAY = {
    'MAIN': 'Centro',
    'NORTE': 'Sucursal Norte',
    'SUR': 'Sucursal Sur'
  };
  

let current = {}; // holds branch, size, qty, days, dates, quote…

// ----------------------
// VIEW: Quote
// ----------------------
async function renderQuoteView() {
  // 1) Branch selector + fetch inventory
  app.innerHTML = `
    <div class="container"><div class="card">
      <h2>Obtener Cotización</h2>
      <div class="form-group">
        <label for="branch">Sucursal</label>
        <select id="branch">
          <option value="MAIN">Centro</option>
          <option value="NORTE">Norte</option>
          <option value="SUR">Sur</option>
        </select>
      </div>
      <img id="sizeImg" class="size-image" src="" alt="" />
      <form id="qtForm">
        <div class="form-group select-group">
          <label for="size">Tamaño del contenedor</label>
          <select id="size">
            <option value="small">S – 3.72 m²</option>
            <option value="medium">M – 7.44 m²</option>
            <option value="large">L – 14.88 m²</option>
            <option value="xlarge">XL – 29.76 m²</option>
          </select>
          <div id="availBadge" class="availability-badge"></div>
        </div>
        <div class="form-group">
          <label for="qty">Cantidad</label>
          <input id="qty" type="number" min="1" value="1" />
        </div>
        <div class="form-group">
          <label for="days">Días de renta</label>
          <input id="days" type="number" min="1" value="1" />
        </div>
        <div class="form-group">
          <label for="startDate">Fecha de inicio</label>
          <input id="startDate" type="date" />
        </div>
        <div class="form-group">
          <label for="endDate">Fecha de fin</label>
          <input id="endDate" type="date" readonly />
        </div>
        <button type="submit" class="btn-primary">Calcular</button>
      </form>
      <div id="quoteResult"></div>
    </div></div>`;

  // DOM refs
  const branchEl    = document.getElementById('branch');
  const sizeEl      = document.getElementById('size');
  const badgeEl     = document.getElementById('availBadge');
  const sizeImg     = document.getElementById('sizeImg');
  const qtyEl       = document.getElementById('qty');
  const daysEl      = document.getElementById('days');
  const startDateEl = document.getElementById('startDate');
  const endDateEl   = document.getElementById('endDate');
  const formEl      = document.getElementById('qtForm');
  const resultEl    = document.getElementById('quoteResult');
  const calcBtn     = formEl.querySelector('button');

  // size → image map
  const sizeImages = {
    small:  'https://static.wixstatic.com/media/6d2a72_c166d4cf4252477c88d919046a669d06~mv2_d_2366_1897_s_2.png',
    medium: 'https://static.wixstatic.com/media/6d2a72_fb82dd290fbc465ba0a146841d84ad5a~mv2.png',
    large:  'https://static.wixstatic.com/media/6d2a72_bf60b4614f4e4ce2a56596930365d561~mv2_d_2366_1882_s_2.png',
    xlarge: 'https://static.wixstatic.com/media/6d2a72_6dbc3c572b774b29a5d879ed8508eb1e~mv2_d_2366_1744_s_2.png'
  };

  let availability = {};

  // fetch inventory for the selected branch
  async function fetchInv() {
    const b = branchEl.value;
    try {
      const resp = await fetch(`/api/inventory?branch=${b}`);
      availability = resp.ok ? await resp.json() : {};
    } catch {
      availability = {};
    }
    updateBadge();
    updateCalcButton();
  }

  // badge + image updater
  function updateBadge() {
    const sz    = sizeEl.value;
    const avail = availability[sz] || 0;
    badgeEl.textContent = `Disponibles: ${avail}`;
    sizeImg.src         = sizeImages[sz];
    sizeImg.alt         = `Contenedor ${sz.toUpperCase()}`;
  }

  // compute end date
  function recalcEnd() {
    if (!startDateEl.value) return endDateEl.value = '';
    const d = new Date(startDateEl.value);
    d.setDate(d.getDate() + parseInt(daysEl.value,10));
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const dd= String(d.getDate()).padStart(2,'0');
    endDateEl.value = `${y}-${m}-${dd}`;
  }

  // enable/disable calc button
  function updateCalcButton() {
    const qty   = parseInt(qtyEl.value,10)||0;
    const avail = availability[sizeEl.value]||0;
    calcBtn.disabled = !startDateEl.value || qty<1 || qty>avail;
  }

  // initial load
  await fetchInv();
  recalcEnd();
  updateCalcButton();

  // event listeners
  branchEl.addEventListener('change', fetchInv);
  sizeEl.addEventListener('change', updateBadge);
  qtyEl.addEventListener('input', updateCalcButton);
  daysEl.addEventListener('input', () => { recalcEnd(); updateCalcButton(); });
  startDateEl.addEventListener('change', () => { recalcEnd(); updateCalcButton(); });

  // form submit → /api/quote
  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const branch   = branchEl.value;
    const size     = sizeEl.value;
    const quantity = parseInt(qtyEl.value,10);
    const days     = parseInt(daysEl.value,10);
    const startDate= startDateEl.value;
    const endDate  = endDateEl.value;
    if (!startDate) return resultEl.textContent = 'Por favor ingresa la fecha de inicio.';

    try {
      const resp = await fetch(API_QUOTE, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({branch,size,quantity,days})
      });
      const js = await resp.json();
      if (!resp.ok) return resultEl.textContent = js.error;
      current = { branch, size, quantity, days, startDate, endDate, quote: js.quote };
      resultEl.textContent = `Cotización: $${js.quote} MXN`;
      location.hash = '#confirm';
    } catch {
      resultEl.textContent = 'Error de red al cotizar';
    }
  });
}

// ----------------------
// VIEW: Confirm
// ----------------------
function renderConfirmView() {
    const { branch, size, quantity, days, startDate, endDate, quote } = current;
    app.innerHTML = `
      <div class="container"><div class="card">
        <h2>Confirmar Cotización</h2>
        <p><strong>Sucursal:</strong> ${BRANCH_DISPLAY[branch] || branch}</p>
        <p><strong>Tamaño:</strong> ${size.toUpperCase()}</p>
        <p><strong>Cantidad:</strong> ${quantity}</p>
        <p><strong>Días de renta:</strong> ${days}</p>
        <p><strong>Fecha inicio:</strong> ${startDate}</p>
        <p><strong>Fecha fin:</strong> ${endDate}</p>
        <p><strong>Total:</strong> $${quote} MXN</p>
  
        <div class="form-group">
          <label for="customerName">Nombre completo</label>
          <input id="customerName" type="text" />
        </div>
        <div class="form-group">
          <label for="customerEmail">Email</label>
          <input id="customerEmail" type="email" />
        </div>
        <div class="form-group">
          <label for="customerPhone">Teléfono</label>
          <input id="customerPhone" type="tel" />
        </div>
  
        <button id="btnConfirm" class="btn-primary">Confirmar Reserva</button>
        <button id="btnBack" class="btn-secondary">← Volver</button>
        <div id="errorMsg" style="color:red;margin-top:1rem;"></div>
      </div></div>`;
  
    document.getElementById('btnBack')
      .addEventListener('click', () => location.hash = '#quote');
  
    document.getElementById('btnConfirm')
      .addEventListener('click', () => {
        const name  = document.getElementById('customerName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const msgEl = document.getElementById('errorMsg');
  
        if (!name || !email || !phone) {
          msgEl.textContent = 'Por favor completa todos los campos del cliente';
          return;
        }
  
        current.customerName = name;
        current.customerEmail = email;
        current.customerPhone = phone;
  
        location.hash = '#reserve';
      });
  }  

// ----------------------
// VIEW: Reserve
// ----------------------
function renderReserveView() {
    app.innerHTML = `
      <div class="container"><div class="card">
        <h2>Procesando Reserva…</h2>
        <p id="reserveMsg">Espere un momento.</p>
      </div></div>`;
  
    (async () => {
      const msgEl = document.getElementById('reserveMsg');
      console.log('Sending payload to /api/reserve:', current);
  
      try {
        const resp = await fetch(API_RESERVE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current)
        });
        const js = await resp.json();
        if (!resp.ok) throw new Error(js.error);
  
        app.innerHTML = `
          <div class="container"><div class="card">
            <h2>¡Reserva confirmada!</h2>
            <p>Tu ID: ${js.reservationId}</p>
            ${js.waSent ? `<p style="color:#2d9cdb;">📱 Confirmación enviada por WhatsApp</p>` : ''}
            <button class="btn-secondary" onclick="location.hash='#quote'">← Nueva Cotización</button>
          </div></div>`;
  
        current.inventory = js.inventory;
      } catch (err) {
        msgEl.textContent = err.message;
      }
    })();
  }  

// ----------------------
// VIEW: Lookup
// ----------------------
function renderLookupView() {
  app.innerHTML = `
    <div class="container"><div class="card">
      <h2>Buscar Reserva</h2>
      <form id="lkForm">
        <div class="form-group">
          <label for="lkId">ID de reserva</label>
          <input id="lkId" type="text" required />
        </div>
        <div class="form-group">
          <label for="lkEmail">Email usado</label>
          <input id="lkEmail" type="email" required />
        </div>
        <button class="btn-primary">Buscar</button>
      </form>
      <div id="lookupResult" style="margin-top:1rem;"></div>
    </div></div>`;

  document.getElementById('lkForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id    = document.getElementById('lkId').value.trim();
    const email = document.getElementById('lkEmail').value.trim();
    const resEl = document.getElementById('lookupResult');
    resEl.textContent = 'Buscando…';

    try {
      const resp = await fetch(`${API_LOOKUP}?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`);
      const js   = await resp.json();
      if (!resp.ok) throw new Error(js.error);

      resEl.innerHTML = `
        <h3>Reserva encontrada:</h3>
        <ul style="line-height:1.5">
          <li><strong>ID:</strong> ${js.id}</li>
          <li><strong>Sucursal:</strong> ${js.branch}</li>
          <li><strong>Cliente:</strong> ${js.customerName} (${js.customerEmail})</li>
          <li><strong>Teléfono:</strong> ${js.customerPhone}</li>
          <li><strong>Tamaño:</strong> ${js.size.toUpperCase()}</li>
          <li><strong>Cantidad:</strong> ${js.quantity}</li>
          <li><strong>Fechas:</strong> ${js.startDate} → ${js.endDate}</li>
          <li><strong>Total:</strong> $${js.quote} MXN</li>
          <li><strong>Creada:</strong> ${new Date(js.timestamp).toLocaleString()}</li>
        </ul>
        <button id="btnCancel" class="btn-secondary" style="margin-top:1rem;">
          Cancelar Reserva
        </button>
      `;

      document.getElementById('btnCancel').onclick = () => {
        current = js;  // stash for cancel
        location.hash = '#cancel';
      };
    } catch (err) {
      resEl.textContent = err.message;
    }
  });
}

// ----------------------
// VIEW: Confirm Cancellation
// ----------------------
function renderCancelView() {
  const { id, branch, size, quantity, customerName } = current;
  app.innerHTML = `
    <div class="container"><div class="card">
      <h2>Confirmar Cancelación</h2>
      <p>Reserva <strong>${id}</strong></p>
      <p><strong>Sucursal:</strong> ${branch}</p>
      <p><strong>Cliente:</strong> ${customerName}</p>
      <p><strong>Contenedor:</strong> ${size.toUpperCase()} ×${quantity}</p>
      <p>¿Deseas cancelar y liberar el inventario?</p>
      <button id="btnYes" class="btn-primary">Sí, cancelar</button>
      <button id="btnNo"  class="btn-secondary">← Volver</button>
      <p id="cancelMsg" style="color:red; margin-top:1rem;"></p>
    </div></div>`;

  document.getElementById('btnNo').onclick = () => location.hash = '#lookup';
  document.getElementById('btnYes').onclick = async () => {
    const msgEl = document.getElementById('cancelMsg');
    msgEl.textContent = '';
    try {
      const resp = await fetch(API_CANCEL, {
        method:'DELETE', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: current.id, email: current.customerEmail })
      });
      const js = await resp.json();
      if (!resp.ok) throw new Error(js.error);
      msgEl.style.color = 'green';
      msgEl.textContent = 'Reserva cancelada correctamente';
      // update badge inventory
      current.inventory = js.inventory;
    } catch (err) {
      msgEl.textContent = err.message;
    }
  };
}

// ----------------------
// VIEW: Metrics
// ----------------------
async function renderMetricsView() {
  app.innerHTML = `
    <div class="container"><div class="card">
      <h2>Métricas</h2>
      <p>Cancelaciones totales: <strong id="cancelCount">…</strong></p>
      <button class="btn-secondary" onclick="location.hash='#quote'">← Volver</button>
    </div></div>`;
  try {
    const js = await fetch(API_METRICS).then(r => r.json());
    document.getElementById('cancelCount').textContent = js.cancelledReservations;
  } catch {
    document.getElementById('cancelCount').textContent = 'error';
  }
}

// --- Admin login & bookings ---
// let adminAuthHeader = null;

function renderAdminAuthView() {
  app.innerHTML = `
    <div class="container"><div class="card">
      <h2>Administración - Login</h2>
      <div class="form-group">
        <label for="adminUser">Usuario</label>
        <input id="adminUser" type="text" />
      </div>
      <div class="form-group">
        <label for="adminPass">Contraseña</label>
        <input id="adminPass" type="password" />
      </div>
      <button id="btnAdminLogin" class="btn-primary">Ingresar</button>
      <div id="adminErr" style="color:red;margin-top:1rem;"></div>
    </div></div>`;

  document.getElementById('btnAdminLogin').onclick = () => {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    if (!user || !pass) {
      document.getElementById('adminErr').textContent = 'Ingrese usuario y contraseña';
      return;
    }
    adminAuthHeader = 'Basic ' + btoa(user + ':' + pass);
    location.hash = '#admin';
  };
}

async function renderAdminView() {
    app.innerHTML = `
    <div class="admin-card">
        <h2>Administración - Reservas</h2>

        <div class="table-responsive">
        <table id="adminTable">
            <thead>
            <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fechas</th>
                <th>Status</th>
                <th>Acción</th>
            </tr>
            </thead>
            <tbody id="adminTbody">
            <tr><td colspan="5">Cargando reservas…</td></tr>
            </tbody>
        </table>
        </div>

        <button class="btn-secondary" onclick="location.hash='#quote'">
        ← Volver
        </button>
    </div>
    `;

  
    try {
      // no headers at all
    const resp = await fetch('/api/admin/bookings');

  
    //   const resp = await fetch('/api/admin/bookings', {
    //     headers: { Authorization: adminAuthHeader }
    //   });
      if (!resp.ok) throw new Error('No autorizado');
  
      const list = await resp.json();
      const rows = list.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${r.customerName}<br/><small>(${r.customerEmail})</small></td>
          <td>${r.startDate} → ${r.endDate}</td>
          <td>${r.status}</td>
          <td>
            ${r.status === 'active'
              ? `<button data-id="${r.id}" class="btn-cancel btn-secondary">Cancelar</button>`
              : ''}
          </td>
        </tr>
      `).join('');
  
      document.getElementById('adminTbody').innerHTML = rows;
  
      // wire up all cancel buttons
      document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          try {
            // const res = await fetch(`/api/admin/booking/${id}`, {
            //   method: 'DELETE',
            //   headers: { Authorization: adminAuthHeader }
            // });
            const rest = await fetch(`/api/admin/booking/${id}`, { method: 'DELETE' });

            if (!res.ok) throw new Error('Cancelación fallida');
            // refresh table
            renderAdminView();
          } catch (e) {
            alert(e.message);
          }
        };
      });
  
    } catch (e) {
      document.getElementById('adminTbody').innerHTML =
        `<tr><td colspan="5" style="color:red;">${e.message}</td></tr>`;
    }
  }
  

// ----------------------
// Router
// ----------------------
function router() {
  switch (location.hash) {
    case '#confirm': renderConfirmView();   break;
    case '#reserve': renderReserveView();   break;
    case '#lookup' : renderLookupView();    break;
    case '#cancel' : renderCancelView();    break;
    case '#metrics': renderMetricsView();   break;
    case '#admin-auth': renderAdminAuthView(); break;
    case '#admin':      renderAdminView();     break;
    default:         renderQuoteView();     break;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
