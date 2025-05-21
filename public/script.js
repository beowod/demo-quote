// public/script.js

const API_QUOTE   = 'http://localhost:7071/api/quote';
const API_RESERVE = 'http://localhost:7071/api/reserve';
const app         = document.getElementById('app');

// holds everything between views
let currentQuoteData = {};

//
// VIEW: Quote + Start/End Date + Availability Badge
//
async function renderQuoteView() {
  // 1) get live inventory
  let availability = {};
  try {
    const invResp = await fetch('http://localhost:7071/api/inventory');
    availability = invResp.ok ? await invResp.json() : {};
  } catch {}

  // 2) image map from tubox.mx
  const sizeImages = {
    small:  'https://static.wixstatic.com/media/6d2a72_c166d4cf4252477c88d919046a669d06~mv2_d_2366_1897_s_2.png',
    medium: 'https://static.wixstatic.com/media/6d2a72_fb82dd290fbc465ba0a146841d84ad5a~mv2.png',
    large:  'https://static.wixstatic.com/media/6d2a72_bf60b4614f4e4ce2a56596930365d561~mv2_d_2366_1882_s_2.png',
    xlarge: 'https://static.wixstatic.com/media/6d2a72_6dbc3c572b774b29a5d879ed8508eb1e~mv2_d_2366_1744_s_2.png'
  };

  // 3) render the form
  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>Obtener Cotización</h2>
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
      </div>
    </div>`;

  // 4) grab DOM references
  const sizeEl      = document.getElementById('size');
  const sizeImg     = document.getElementById('sizeImg');
  const badgeEl     = document.getElementById('availBadge');
  const qtyEl       = document.getElementById('qty');
  const daysEl      = document.getElementById('days');
  const startDateEl = document.getElementById('startDate');
  const endDateEl   = document.getElementById('endDate');
  const formEl      = document.getElementById('qtForm');
  const resultEl    = document.getElementById('quoteResult');
  const calcBtn     = formEl.querySelector('button');

  // 5) helpers
  function updateBadgeAndImage() {
    const sz    = sizeEl.value;
    const avail = availability[sz] || 0;
    badgeEl.textContent = `Disponibles: ${avail}`;
    sizeImg.src         = sizeImages[sz];
    sizeImg.alt         = `Contenedor ${sz.toUpperCase()}`;
  }

  function recalcEnd() {
    if (!startDateEl.value) {
      endDateEl.value = '';
      return;
    }
    const d = new Date(startDateEl.value);
    d.setDate(d.getDate() + parseInt(daysEl.value, 10));
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    endDateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  function updateCalcButton() {
    const qty   = parseInt(qtyEl.value, 10) || 0;
    const avail = availability[sizeEl.value] || 0;
    // require startDate, qty <= avail, qty>=1
    calcBtn.disabled = !startDateEl.value || qty < 1 || qty > avail;
  }

  // 6) initialize state
  updateBadgeAndImage();
  recalcEnd();
  updateCalcButton();

  // 7) events
  sizeEl.addEventListener('change', () => {
    updateBadgeAndImage();
    updateCalcButton();
  });
  qtyEl.addEventListener('input', updateCalcButton);
  daysEl.addEventListener('input', () => { recalcEnd(); updateCalcButton(); });
  startDateEl.addEventListener('change', () => { recalcEnd(); updateCalcButton(); });

  // 8) submit handler (real logic)
  formEl.addEventListener('submit', async e => {
    e.preventDefault();

    const size      = sizeEl.value;
    const quantity  = parseInt(qtyEl.value, 10);
    const days      = parseInt(daysEl.value, 10);
    const startDate = startDateEl.value;
    const endDate   = endDateEl.value;

    if (!startDate) {
      resultEl.textContent = 'Por favor ingresa la fecha de inicio.';
      return;
    }

    try {
      const resp = await fetch(API_QUOTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, quantity, days })
      });
      const js = await resp.json();

      if (!resp.ok) {
        resultEl.textContent = js.error || 'Error al cotizar';
        return;
      }

      // stash for confirmation & reservation
      currentQuoteData = { size, quantity, days, startDate, endDate, quote: js.quote };

      resultEl.textContent = `Cotización: $${js.quote} MXN`;
      location.hash = '#confirm';
    } catch (err) {
      console.error(err);
      resultEl.textContent = 'Error de red al cotizar';
    }
  });
}

//
// VIEW: Confirmation (read‐only summary + confirm button)
//
function renderConfirmView() {
  const { size, quantity, days, startDate, endDate, quote } = currentQuoteData;

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>Confirmar Cotización</h2>
        <p><strong>Tamaño:</strong> ${size.toUpperCase()}</p>
        <p><strong>Cantidad:</strong> ${quantity}</p>
        <p><strong>Días de renta:</strong> ${days}</p>
        <p><strong>Fecha inicio:</strong> ${startDate}</p>
        <p><strong>Fecha fin:</strong> ${endDate}</p>
        <p><strong>Total:</strong> $${quote} MXN</p>

        <button id="btnConfirm" class="btn-primary">Confirmar Reserva</button>
        <button id="btnBack"    class="btn-secondary">← Volver</button>
      </div>
    </div>`;

  document.getElementById('btnBack')
    .addEventListener('click', () => location.hash = '#quote');

  document.getElementById('btnConfirm')
    .addEventListener('click', () => location.hash = '#reserve');
}

//
// VIEW: Reservation stub
//
function renderReserveView() {
  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>Reserva</h2>
        <p>¡Reserva completada! (aquí irá la llamada a /api/reserve)</p>
        <button class="btn-secondary" onclick="location.hash='#quote'">
          ← Nueva Cotización
        </button>
      </div>
    </div>`;
}

//
// ROUTER
//
function router() {
  switch (location.hash) {
    case '#confirm': renderConfirmView(); break;
    case '#reserve': renderReserveView(); break;
    default:          renderQuoteView();   break;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);