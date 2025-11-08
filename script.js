const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzhjP_6H1q_sGNyWIshuz4AHv_E5oZLqyTnmVrgkz0JHAKEa9t4B-8uzVpNRtypIK-R/exec";

// --- INICIALIZACIÓN Y NAVEGACIÓN ---
let calendar; // Variable global para la instancia del calendario
let editModalInstance; // Para controlar el modal de edición
let currentIntenciones = []; // Almacenará los datos de la consulta actual

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    showView('dashboard');
    if (document.getElementById('editModal')) {
        editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
    }
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            showView(link.getAttribute('data-view'));
        });
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    switch(viewId) {
        case 'dashboard': loadDashboardView(); break;
        case 'tabla': loadTablaView(); break;
        case 'calendario': loadCalendarView(); break;
        case 'registro': loadRegistroView(); break;
    }
}


// --- CARGADORES DE CONTENIDO PARA CADA VISTA ---
// (Estas funciones no cambian)
function loadDashboardView() {
    const view = document.getElementById('dashboard');
    view.innerHTML = `
        <h2 class="view-title">Dashboard</h2>
        <div class="row g-4 mb-4">
            <div class="col-md-6"><div class="card kpi-card"><div class="text-content"><p class="kpi-title">Intenciones para Hoy</p><h3 class="kpi-value" id="stat-today">...</h3></div><div class="icon-wrapper bg-primary"><i class="bi bi-calendar-heart"></i></div></div></div>
            <div class="col-md-6"><div class="card kpi-card"><div class="text-content"><p class="kpi-title">Intenciones Próximos 7 Días</p><h3 class="kpi-value" id="stat-week">...</h3></div><div class="icon-wrapper bg-success"><i class="bi bi-calendar-week"></i></div></div></div>
        </div>
        <div class="card p-4"><h5 class="mb-3">Registros Recientes</h5><div class="table-responsive"><table class="clean-table" id="recent-intenciones-table"><thead><tr><th>Intención</th><th>Categoría</th><th>Fecha de Misa</th></tr></thead><tbody><tr><td colspan="3" class="text-center p-4">Cargando...</td></tr></tbody></table></div></div>
    `;
    fetchDashboardStats();
    fetchRecentIntenciones();
}
function loadTablaView() {
    const view = document.getElementById('tabla');
    view.innerHTML = `<div class="card p-4"><h2 class="view-title">Consultas y Reportes</h2><div class="row g-3 align-items-end mb-4"><div class="col-md-4"><label for="fecha-reporte" class="form-label">Fecha</label><input type="date" class="form-control" id="fecha-reporte"></div><div class="col-md-4"><label for="hora-reporte" class="form-label">Hora</label><select id="hora-reporte" class="form-select"></select></div><div class="col-md-4"><button class="btn btn-primary w-100" id="btn-generar-reporte"><i class="bi bi-file-earmark-pdf-fill me-1"></i> Generar Documento</button></div></div><hr class="my-4"><h5>Intenciones Encontradas: <span id="contador-intenciones">0</span></h5><div id="resultado-consulta" class="mt-3"></div></div>`;
    setupTablaListeners();
}
function loadCalendarView() {
    const view = document.getElementById('calendario');
    view.innerHTML = `<div class="card p-4"><h2 class="view-title">Calendario de Intenciones</h2><div id="calendar-container"></div></div>`;
    const calendarEl = document.getElementById('calendar-container');
    if (calendar) { calendar.destroy(); }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', locale: 'es', headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        events: (fetchInfo, successCallback, failureCallback) => {
            const { start } = fetchInfo;
            fetch(`${WEB_APP_URL}?action=getIntencionesForCalendar&year=${start.getFullYear()}&month=${start.getMonth() + 1}`)
                .then(res => res.json()).then(events => successCallback(events)).catch(err => failureCallback(err));
        }
    });
    calendar.render();
}
function loadRegistroView() {
    const view = document.getElementById('registro');
    view.innerHTML = `<div class="card p-4"><h2 class="view-title">Registro de Intenciones</h2><ul class="nav nav-pills mb-3" id="pills-tab"><li class="nav-item"><button class="nav-link active" id="pills-rapido-tab" data-bs-toggle="pill" data-bs-target="#pills-rapido">Registro Rápido</button></li><li class="nav-item"><button class="nav-link" id="pills-programado-tab" data-bs-toggle="pill" data-bs-target="#pills-programado">Intención Programada</button></li></ul><div class="tab-content" id="pills-tabContent"><div class="tab-pane fade show active" id="pills-rapido"><form id="form-rapido"></form></div><div class="tab-pane fade" id="pills-programado"><form id="form-programado"></form></div></div></div>`;
    injectFormHTML();
    setupFormListeners();
}
function injectFormHTML(){document.getElementById("form-rapido").innerHTML=`<div class=row g-3><div class="col-md-6"><label for=fecha-rapido class=form-label>Fecha de la Misa</label><input type=date class=form-control id=fecha-rapido required></div><div class="col-md-6"><label for=hora-rapido class=form-label>Hora de la Misa</label><select id=hora-rapido class=form-select required></select></div><div class=col-12><label for=categoria-rapido class=form-label>Categoría</label><select id=categoria-rapido class=form-select required><option value="En Acción de Gracias">En Acción de Gracias</option><option value="Por la Salud de">Por la Salud de</option><option value="Por la Vida y la Salud">Por la Vida y la Salud</option><option value="Por el Alma de">Por el Alma de</option></select></div><div class=col-12><label for=intenciones-rapido class=form-label>Intenciones (una por línea)</label><textarea class=form-control id=intenciones-rapido rows=8 placeholder="Ej:\nJuan Pérez\nFamilia Gómez (Aniversario)"></textarea></div></div><button type=submit class="btn btn-primary mt-4">Guardar Intenciones</button>`,document.getElementById("form-programado").innerHTML=`<div class=row g-3><div class="col-md-6"><label for=fecha-inicio-prog class=form-label>Desde la Fecha</label><input type=date class=form-control id=fecha-inicio-prog required></div><div class="col-md-6"><label for=fecha-fin-prog class=form-label>Hasta la Fecha</label><input type=date class=form-control id=fecha-fin-prog required></div><div class="col-md-6"><label for=hora-prog class=form-label>Hora de la Misa</label><select id=hora-prog class=form-select required><option value=18:00>18:00 (Diaria)</option><option value=09:00>09:00 (Domingo)</option><option value=12:00>12:00 (Domingo)</option></select></div><div class="col-md-6"><label for=categoria-prog class=form-label>Categoría</label><select id=categoria-prog class=form-select required><option value="En Acción de Gracias">En Acción de Gracias</option><option value="Por la Salud de">Por la Salud de</option><option value="Por la Vida y la Salud">Por la Vida y la Salud</option><option value="Por el Alma de">Por el Alma de</option></select></div><div class=col-12><label for=intencion-prog class=form-label>Intención (Nombre)</label><input type=text class=form-control id=intencion-prog required></div><div class=col-12><label for=nota-prog class=form-label>Nota (Opcional)</label><input type=text class=form-control id=nota-prog placeholder="Ej: (Aniversario)"></div><div class=col-12><label class=form-label>Seleccionar Días</label><div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Lunes id=checkLunes checked><label class=form-check-label for=checkLunes>L</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Martes id=checkMartes checked><label class=form-check-label for=checkMartes>M</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Miércoles id=checkMiercoles checked><label class=form-check-label for=checkMiercoles>X</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Jueves id=checkJueves checked><label class=form-check-label for=checkJueves>J</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Viernes id=checkViernes checked><label class=form-check-label for=checkViernes>V</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Sábado id=checkSabado checked><label class=form-check-label for=checkSabado>S</label></div><div class="form-check form-check-inline"><input class=form-check-input type=checkbox value=Domingo id=checkDomingo checked><label class=form-check-label for=checkDomingo>D</label></div></div><div class="form-check mt-2"><input class=form-check-input type=checkbox id=excluir-domingos-prog><label class=form-check-label for=excluir-domingos-prog>Excluir Domingos</label></div></div></div><button type=submit class="btn btn-primary mt-4">Programar Intención</button>`}


// --- FETCHERS DE DATOS (LLAMADAS A LA API) ---
// (Estas funciones no cambian)
function fetchDashboardStats(){fetch(`${WEB_APP_URL}?action=getDashboardStats`).then(e=>e.json()).then(e=>{document.getElementById("stat-today").textContent=e.intencionesHoy,document.getElementById("stat-week").textContent=e.intencionesSemana}).catch(e=>console.error("Error fetching stats:",e))}
function fetchRecentIntenciones(){const e=document.querySelector("#recent-intenciones-table tbody");fetch(`${WEB_APP_URL}?action=getRecentIntenciones`).then(e=>e.json()).then(t=>{if(e.innerHTML="",!t||0===t.length)return void(e.innerHTML='<tr><td colspan="3" class="text-center p-4">No hay registros recientes.</td></tr>');t.forEach(t=>{const n=`<tr><td><strong>${t.intencion}</strong> ${t.nota||""}</td><td>${t.categoria}</td><td>${t.fechaMisa}</td></tr>`;e.innerHTML+=n})}).catch(t=>{console.error("Error fetching recents:",t),e.innerHTML='<tr><td colspan="3" class="text-center text-danger p-4">Error al cargar registros.</td></tr>'})}
function actualizarHorasMisa(e,t){const n=document.getElementById(t);n.innerHTML="",e&&fetch(`${WEB_APP_URL}?action=getHorasMisa&fecha=${e}`).then(e=>e.json()).then(e=>{e.forEach(e=>{const o=document.createElement("option");o.value=e,o.textContent=e,n.appendChild(o)})}).catch(e=>mostrarAlerta("Error al cargar horas: "+e,"danger"))}


// =========================================================
// === BLOQUE MOVIDO: LÓGICA PARA EDICIÓN Y ELIMINACIÓN ===
// =========================================================
// Estas funciones ahora están ANTES de ser llamadas por setupTablaListeners

function handleEditClick(rowId) {
    const intencion = currentIntenciones.find(i => i.row == rowId);
    if (intencion) {
        document.getElementById('editRowId').value = intencion.row;
        document.getElementById('editIntencion').value = intencion.intencion;
        document.getElementById('editNota').value = intencion.nota;
        document.getElementById('editCategoria').value = intencion.categoria;
        editModalInstance.show();
    }
}

function handleDeleteClick(rowId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta intención? Esta acción no se puede deshacer.')) {
        mostrarLoader();
        const payload = { action: 'deleteIntencion', data: { row: rowId } };
        fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(response => {
                ocultarLoader();
                if (response.status === 'ok') {
                    mostrarAlerta(response.message, 'success');
                    consultarIntenciones(); // Recargar la lista
                } else {
                    mostrarAlerta(response.message, 'danger');
                }
            })
            .catch(handleFormError);
    }
}

function saveEditChanges() {
    mostrarLoader();
    const payload = {
        action: 'editIntencion',
        data: {
            row: document.getElementById('editRowId').value,
            intencion: document.getElementById('editIntencion').value,
            nota: document.getElementById('editNota').value,
            categoria: document.getElementById('editCategoria').value
        }
    };
    fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(response => {
            ocultarLoader();
            editModalInstance.hide();
            if (response.status === 'ok') {
                mostrarAlerta(response.message, 'success');
                consultarIntenciones(); // Recargar la lista
            } else {
                mostrarAlerta(response.message, 'danger');
            }
        })
        .catch(err => {
            ocultarLoader();
            editModalInstance.hide();
            handleFormError(err);
        });
}


// --- EVENT LISTENERS PARA FORMULARIOS Y ACCIONES ---

function setupFormListeners() {
    // ... (Esta función no cambia)
    const today = new Date().toISOString().split('T')[0];
    const formRapido = document.getElementById('form-rapido');
    if (formRapido) {
        const fechaRapidoInput = document.getElementById('fecha-rapido');
        fechaRapidoInput.value = today;
        actualizarHorasMisa(today, 'hora-rapido');
        fechaRapidoInput.addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-rapido'));
        formRapido.addEventListener('submit', (e) => {
            e.preventDefault(); mostrarLoader();
            const payload = { action: 'registrarRapido', data: { fecha: fechaRapidoInput.value, hora: document.getElementById('hora-rapido').value, categoria: document.getElementById('categoria-rapido').value, intenciones: document.getElementById('intenciones-rapido').value } };
            fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) }).then(res => res.json()).then(handleFormResponse).catch(handleFormError);
        });
    }
    const formProgramado = document.getElementById('form-programado');
    if (formProgramado) {
        document.getElementById('fecha-inicio-prog').value = today;
        document.getElementById('fecha-fin-prog').value = today;
        formProgramado.addEventListener('submit', (e) => {
            e.preventDefault(); mostrarLoader();
            const dias = Array.from(document.querySelectorAll('#form-programado input[type=checkbox]:checked')).filter(cb => cb.id !== 'excluir-domingos-prog').map(cb => cb.value);
            const payload = { action: 'registrarProgramado', data: { fechaInicio: document.getElementById('fecha-inicio-prog').value, fechaFin: document.getElementById('fecha-fin-prog').value, hora: document.getElementById('hora-prog').value, categoria: document.getElementById('categoria-prog').value, intencion: document.getElementById('intencion-prog').value, nota: document.getElementById('nota-prog').value, dias: dias, excluirDomingos: document.getElementById('excluir-domingos-prog').checked } };
            fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) }).then(res => res.json()).then(handleFormResponse).catch(handleFormError);
        });
    }
}

function setupTablaListeners() {
    const today = new Date().toISOString().split('T')[0];
    const fechaReporteInput = document.getElementById('fecha-reporte');
    fechaReporteInput.value = today;
    actualizarHorasMisa(today, 'hora-reporte');
    consultarIntenciones();
    fechaReporteInput.addEventListener('change', () => {
        actualizarHorasMisa(fechaReporteInput.value, 'hora-reporte');
        consultarIntenciones();
    });
    document.getElementById('hora-reporte').addEventListener('change', consultarIntenciones);
    document.getElementById('btn-generar-reporte').addEventListener('click', () => {
        const fecha = fechaReporteInput.value; const hora = document.getElementById('hora-reporte').value;
        if (!fecha || !hora) return mostrarAlerta('Debes seleccionar fecha y hora.', 'warning');
        mostrarLoader();
        const payload = { action: 'generarDocumento', data: { fecha, hora } };
        fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json()).then(response => {
                ocultarLoader();
                if(response.status === 'ok') { mostrarAlerta(`Documento generado. <a href="${response.url}" target="_blank" class="alert-link"><strong>Abrir Documento</strong></a>`, 'success'); }
                else { mostrarAlerta('Error al generar el documento.', 'danger'); }
            }).catch(err => { ocultarLoader(); mostrarAlerta('Error inesperado: ' + err, 'danger'); });
    });
    const resultadoContainer = document.getElementById('resultado-consulta');
    resultadoContainer.addEventListener('click', function(e) {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        if (editButton) { handleEditClick(editButton.dataset.row); }
        if (deleteButton) { handleDeleteClick(deleteButton.dataset.row); }
    });
    document.getElementById('saveEditButton').addEventListener('click', saveEditChanges);
}

function consultarIntenciones() {
    const fecha = document.getElementById('fecha-reporte').value;
    const hora = document.getElementById('hora-reporte').value;
    const resultadoConsulta = document.getElementById('resultado-consulta');
    const contador = document.getElementById('contador-intenciones');
    if (!fecha) return;
    fetch(`${WEB_APP_URL}?action=getIntenciones&fecha=${fecha}`)
        .then(res => res.json())
        .then(intenciones => {
            currentIntenciones = intenciones;
            resultadoConsulta.innerHTML = '';
            const intencionesFiltradas = intenciones.filter(i => !hora || i.horaMisa == hora);
            contador.textContent = intencionesFiltradas.length;
            if (intencionesFiltradas.length === 0) {
                resultadoConsulta.innerHTML = '<p class="text-muted">No se encontraron intenciones.</p>';
            } else {
                const table = document.createElement('table'); table.className = 'table table-hover';
                table.innerHTML = `<thead><tr><th>Intención</th><th>Categoría</th><th>Hora</th><th>Acciones</th></tr></thead><tbody></tbody>`;
                const tbody = table.querySelector('tbody');
                intencionesFiltradas.forEach(i => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td><strong>${i.intencion}</strong> ${i.nota || ''}</td><td>${i.categoria}</td><td>${i.horaMisa}</td><td><button class="btn btn-sm btn-outline-primary edit-btn" data-row="${i.row}"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger delete-btn" data-row="${i.row}"><i class="bi bi-trash"></i></button></td>`;
                    tbody.appendChild(tr);
                });
                resultadoConsulta.appendChild(table);
            }
        });
}


// --- FUNCIONES DE RESPUESTA Y UTILIDADES ---
// (Estas funciones no cambian)
function handleFormResponse(e){ocultarLoader(),"ok"===e.status?(mostrarAlerta(e.message,"success"),document.getElementById("form-rapido")&&document.getElementById("form-rapido").reset(),document.getElementById("form-programado")&&document.getElementById("form-programado").reset(),loadRegistroView()):mostrarAlerta(e.message,"info"===e.status?"info":"danger")}
function handleFormError(e){ocultarLoader(),mostrarAlerta("Error de conexión. Revisa tu conexión a internet.","danger"),console.error("Fetch Error:",e)}
const loader=document.getElementById("loader");function mostrarLoader(){loader.classList.remove("d-none")}function ocultarLoader(){loader.classList.add("d-none")}
function mostrarAlerta(e,t="success"){const n=document.querySelector("body"),o=document.createElement("div");o.style.position="fixed",o.style.top="20px",o.style.right="20px",o.style.zIndex="1050",o.className=`alert alert-${t} alert-dismissible fade show shadow-lg`,o.innerHTML=`${e}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`,n.appendChild(o),setTimeout(()=>{const e=bootstrap.Alert.getOrCreateInstance(o);e&&e.close()},5e3)}
