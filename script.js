const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzhjP_6H1q_sGNyWIshuz4AHv_E5oZLqyTnmVrgkz0JHAKEa9t4B-8uzVpNRtypIK-R/exec";

// --- INICIALIZACIÓN Y NAVEGACIÓN ---
let calendar; // Variable global para la instancia del calendario

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    // Cargar la vista inicial del dashboard por defecto
    showView('dashboard');
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            showView(viewId);
        });
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const activeView = document.getElementById(viewId);
    activeView.classList.add('active');
    
    // Cargar el contenido HTML y la lógica específica de cada vista
    switch(viewId) {
        case 'dashboard':
            loadDashboardView();
            break;
        case 'tabla':
            loadTablaView();
            break;
        case 'calendario':
            loadCalendarView();
            break;
        case 'registro':
            loadRegistroView();
            break;
    }
}


// --- CARGADORES DE CONTENIDO PARA CADA VISTA ---

function loadDashboardView() {
    const view = document.getElementById('dashboard');
    view.innerHTML = `
        <h2 class="view-title">Dashboard</h2>
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card kpi-card">
                    <div class="text-content">
                        <p class="kpi-title">Intenciones para Hoy</p>
                        <h3 class="kpi-value" id="stat-today">...</h3>
                    </div>
                    <div class="icon-wrapper bg-primary"><i class="bi bi-calendar-heart"></i></div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card kpi-card">
                    <div class="text-content">
                        <p class="kpi-title">Intenciones Próximos 7 Días</p>
                        <h3 class="kpi-value" id="stat-week">...</h3>
                    </div>
                    <div class="icon-wrapper bg-success"><i class="bi bi-calendar-week"></i></div>
                </div>
            </div>
        </div>
        <div class="card p-4">
            <h5 class="mb-3">Registros Recientes</h5>
            <div class="table-responsive">
                <table class="clean-table" id="recent-intenciones-table">
                    <thead><tr><th>Intención</th><th>Categoría</th><th>Fecha de Misa</th></tr></thead>
                    <tbody><tr><td colspan="3" class="text-center p-4">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    fetchDashboardStats();
    fetchRecentIntenciones();
}

function loadTablaView() {
    const view = document.getElementById('tabla');
    view.innerHTML = `
        <div class="card p-4">
            <h2 class="view-title">Consultas y Reportes</h2>
            <div class="row g-3 align-items-end mb-4">
                <div class="col-md-4">
                    <label for="fecha-reporte" class="form-label">Fecha</label>
                    <input type="date" class="form-control" id="fecha-reporte">
                </div>
                <div class="col-md-4">
                    <label for="hora-reporte" class="form-label">Hora</label>
                    <select id="hora-reporte" class="form-select"></select>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-primary w-100" id="btn-generar-reporte">
                        <i class="bi bi-file-earmark-pdf-fill me-1"></i> Generar Documento
                    </button>
                </div>
            </div>
            <hr class="my-4">
            <h5>Intenciones Encontradas: <span id="contador-intenciones">0</span></h5>
            <div id="resultado-consulta" class="mt-3"></div>
        </div>
    `;
    setupTablaListeners();
}


function loadCalendarView() {
    const view = document.getElementById('calendario');
    view.innerHTML = `
        <div class="card p-4">
            <h2 class="view-title">Calendario de Intenciones</h2>
            <div id="calendar-container"></div>
        </div>
    `;
    const calendarEl = document.getElementById('calendar-container');

    // Destruir la instancia anterior si existe para evitar duplicados al cambiar de vista
    if (calendar) {
        calendar.destroy();
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es', // Para que se muestre en español
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            const year = fetchInfo.start.getFullYear();
            const month = fetchInfo.start.getMonth() + 1; // getMonth es 0-indexado
            fetch(`${WEB_APP_URL}?action=getIntencionesForCalendar&year=${year}&month=${month}`)
                .then(res => res.json())
                .then(events => successCallback(events))
                .catch(err => failureCallback(err));
        }
    });
    calendar.render();
}

function loadRegistroView() {
    const view = document.getElementById('registro');
    view.innerHTML = `
        <div class="card p-4">
            <h2 class="view-title">Registro de Intenciones</h2>
            <ul class="nav nav-pills mb-3" id="pills-tab">
                <li class="nav-item">
                    <button class="nav-link active" id="pills-rapido-tab" data-bs-toggle="pill" data-bs-target="#pills-rapido">Registro Rápido</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="pills-programado-tab" data-bs-toggle="pill" data-bs-target="#pills-programado">Intención Programada</button>
                </li>
            </ul>
            <div class="tab-content" id="pills-tabContent">
                <div class="tab-pane fade show active" id="pills-rapido">
                    <form id="form-rapido"></form>
                </div>
                <div class="tab-pane fade" id="pills-programado">
                    <form id="form-programado"></form>
                </div>
            </div>
        </div>
    `;
    injectFormHTML();
    setupFormListeners();
}

function injectFormHTML() {
    document.getElementById('form-rapido').innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <label for="fecha-rapido" class="form-label">Fecha de la Misa</label>
                <input type="date" class="form-control" id="fecha-rapido" required>
            </div>
            <div class="col-md-6">
                <label for="hora-rapido" class="form-label">Hora de la Misa</label>
                <select id="hora-rapido" class="form-select" required></select>
            </div>
            <div class="col-12">
                <label for="categoria-rapido" class="form-label">Categoría</label>
                <select id="categoria-rapido" class="form-select" required>
                    <option value="En Acción de Gracias">En Acción de Gracias</option>
                    <option value="Por la Salud de">Por la Salud de</option>
                    <option value="Por la Vida y la Salud">Por la Vida y la Salud</option>
                    <option value="Por el Alma de">Por el Alma de</option>
                </select>
            </div>
            <div class="col-12">
                <label for="intenciones-rapido" class="form-label">Intenciones (una por línea)</label>
                <textarea class="form-control" id="intenciones-rapido" rows="8" placeholder="Ej:\nJuan Pérez\nFamilia Gómez (Aniversario)"></textarea>
            </div>
        </div>
        <button type="submit" class="btn btn-primary mt-4">Guardar Intenciones</button>
    `;

    document.getElementById('form-programado').innerHTML = `
         <div class="row g-3">
            <div class="col-md-6"><label for="fecha-inicio-prog" class="form-label">Desde la Fecha</label><input type="date" class="form-control" id="fecha-inicio-prog" required></div>
            <div class="col-md-6"><label for="fecha-fin-prog" class="form-label">Hasta la Fecha</label><input type="date" class="form-control" id="fecha-fin-prog" required></div>
            <div class="col-md-6"><label for="hora-prog" class="form-label">Hora de la Misa</label><select id="hora-prog" class="form-select" required><option value="18:00">18:00 (Diaria)</option><option value="09:00">09:00 (Domingo)</option><option value="12:00">12:00 (Domingo)</option></select></div>
            <div class="col-md-6"><label for="categoria-prog" class="form-label">Categoría</label><select id="categoria-prog" class="form-select" required><option value="En Acción de Gracias">En Acción de Gracias</option><option value="Por la Salud de">Por la Salud de</option><option value="Por la Vida y la Salud">Por la Vida y la Salud</option><option value="Por el Alma de">Por el Alma de</option></select></div>
            <div class="col-12"><label for="intencion-prog" class="form-label">Intención (Nombre)</label><input type="text" class="form-control" id="intencion-prog" required></div>
            <div class="col-12"><label for="nota-prog" class="form-label">Nota (Opcional)</label><input type="text" class="form-control" id="nota-prog" placeholder="Ej: (Aniversario)"></div>
            <div class="col-12">
                <label class="form-label">Seleccionar Días</label>
                <div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Lunes" id="checkLunes" checked><label class="form-check-label" for="checkLunes">L</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Martes" id="checkMartes" checked><label class="form-check-label" for="checkMartes">M</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Miércoles" id="checkMiercoles" checked><label class="form-check-label" for="checkMiercoles">X</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Jueves" id="checkJueves" checked><label class="form-check-label" for="checkJueves">J</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Viernes" id="checkViernes" checked><label class="form-check-label" for="checkViernes">V</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Sábado" id="checkSabado" checked><label class="form-check-label" for="checkSabado">S</label></div>
                    <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Domingo" id="checkDomingo" checked><label class="form-check-label" for="checkDomingo">D</label></div>
                </div>
                <div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="excluir-domingos-prog"><label class="form-check-label" for="excluir-domingos-prog">Excluir Domingos</label></div>
            </div>
        </div>
        <button type="submit" class="btn btn-primary mt-4">Programar Intención</button>
    `;
}

// --- FETCHERS DE DATOS (LLAMADAS A LA API) ---

function fetchDashboardStats() {
    fetch(`${WEB_APP_URL}?action=getDashboardStats`)
        .then(res => res.json())
        .then(stats => {
            document.getElementById('stat-today').textContent = stats.intencionesHoy;
            document.getElementById('stat-week').textContent = stats.intencionesSemana;
        }).catch(err => console.error("Error fetching stats:", err));
}

function fetchRecentIntenciones() {
    const tableBody = document.querySelector("#recent-intenciones-table tbody");
    fetch(`${WEB_APP_URL}?action=getRecentIntenciones`)
        .then(res => res.json())
        .then(data => {
            tableBody.innerHTML = '';
            if (!data || data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-4">No hay registros recientes.</td></tr>`;
                return;
            }
            data.forEach(item => {
                const row = `<tr>
                    <td><strong>${item.intencion}</strong> ${item.nota || ''}</td>
                    <td>${item.categoria}</td>
                    <td>${item.fechaMisa}</td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        }).catch(err => {
            console.error("Error fetching recents:", err);
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger p-4">Error al cargar registros.</td></tr>`;
        });
}

function actualizarHorasMisa(fechaStr, selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    if (!fechaStr) return;
    
    fetch(`${WEB_APP_URL}?action=getHorasMisa&fecha=${fechaStr}`)
        .then(response => response.json())
        .then(horas => {
            horas.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                select.appendChild(option);
            });
        })
        .catch(err => mostrarAlerta('Error al cargar horas: ' + err, 'danger'));
}

// --- EVENT LISTENERS PARA FORMULARIOS Y ACCIONES ---

function setupFormListeners() {
    const today = new Date().toISOString().split('T')[0];

    // Formulario Rápido
    const formRapido = document.getElementById('form-rapido');
    if (formRapido) {
        const fechaRapidoInput = document.getElementById('fecha-rapido');
        fechaRapidoInput.value = today;
        actualizarHorasMisa(today, 'hora-rapido');
        fechaRapidoInput.addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-rapido'));
        
        formRapido.addEventListener('submit', (e) => {
            e.preventDefault();
            mostrarLoader();
            const payload = {
                action: 'registrarRapido',
                data: {
                    fecha: fechaRapidoInput.value,
                    hora: document.getElementById('hora-rapido').value,
                    categoria: document.getElementById('categoria-rapido').value,
                    intenciones: document.getElementById('intenciones-rapido').value
                }
            };
            
            fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(handleFormResponse)
            .catch(handleFormError);
        });
    }

    // Formulario Programado
    const formProgramado = document.getElementById('form-programado');
    if (formProgramado) {
        document.getElementById('fecha-inicio-prog').value = today;
        document.getElementById('fecha-fin-prog').value = today;

        formProgramado.addEventListener('submit', (e) => {
            e.preventDefault();
            mostrarLoader();
            const dias = Array.from(document.querySelectorAll('#form-programado input[type=checkbox]:checked'))
                .filter(cb => cb.id !== 'excluir-domingos-prog')
                .map(cb => cb.value);
            const payload = {
                action: 'registrarProgramado',
                data: {
                    fechaInicio: document.getElementById('fecha-inicio-prog').value,
                    fechaFin: document.getElementById('fecha-fin-prog').value,
                    hora: document.getElementById('hora-prog').value,
                    categoria: document.getElementById('categoria-prog').value,
                    intencion: document.getElementById('intencion-prog').value,
                    nota: document.getElementById('nota-prog').value,
                    dias: dias,
                    excluirDomingos: document.getElementById('excluir-domingos-prog').checked
                }
            };

            fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(handleFormResponse)
            .catch(handleFormError);
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
        const fecha = fechaReporteInput.value;
        const hora = document.getElementById('hora-reporte').value;
        if (!fecha || !hora) return mostrarAlerta('Debes seleccionar fecha y hora.', 'warning');
        
        mostrarLoader();
        const payload = { action: 'generarDocumento', data: { fecha, hora } };

        fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(response => {
                ocultarLoader();
                if(response.status === 'ok') {
                    mostrarAlerta(`Documento generado. <a href="${response.url}" target="_blank" class="alert-link"><strong>Abrir Documento</strong></a>`, 'success');
                } else {
                    mostrarAlerta('Error al generar el documento.', 'danger');
                }
            })
            .catch(err => {
                ocultarLoader();
                mostrarAlerta('Error inesperado: ' + err, 'danger');
            });
    });
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
            resultadoConsulta.innerHTML = '';
            const intencionesFiltradas = intenciones.filter(i => !hora || i.horaMisa == hora);
            contador.textContent = intencionesFiltradas.length;
            
            if (intencionesFiltradas.length === 0) {
                resultadoConsulta.innerHTML = '<p class="text-muted">No se encontraron intenciones para esta fecha y hora.</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'list-group list-group-flush';
                intencionesFiltradas.forEach(i => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.innerHTML = `<strong>${i.intencion}</strong> ${i.nota || ''} <br><small class="text-muted">${i.categoria} - ${i.horaMisa}</small>`;
                    ul.appendChild(li);
                });
                resultadoConsulta.appendChild(ul);
            }
        });
}

// --- FUNCIONES DE RESPUESTA Y UTILIDADES ---

function handleFormResponse(response) {
    ocultarLoader();
    if (response.status === 'ok') {
        mostrarAlerta(response.message, 'success');
        // Resetear el formulario específico
        if (document.getElementById('form-rapido')) document.getElementById('form-rapido').reset();
        if (document.getElementById('form-programado')) document.getElementById('form-programado').reset();
        loadRegistroView(); // Recargar la vista para resetear fechas y estado
    } else {
        mostrarAlerta(response.message, response.status === 'info' ? 'info' : 'danger');
    }
}

function handleFormError(err) {
    ocultarLoader();
    mostrarAlerta('Error de conexión. Revisa tu conexión a internet.', 'danger');
    console.error("Fetch Error:", err);
}

const loader = document.getElementById('loader');
function mostrarLoader() { loader.classList.remove('d-none'); }
function ocultarLoader() { loader.classList.add('d-none'); }

function mostrarAlerta(mensaje, tipo = 'success') {
    const contenedor = document.querySelector('body');
    const alerta = document.createElement('div');
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '1050';
    alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow-lg`;
    alerta.innerHTML = `${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    contenedor.appendChild(alerta);
    setTimeout(() => {
        const alertInstance = bootstrap.Alert.getOrCreateInstance(alerta);
        if (alertInstance) {
            alertInstance.close();
        }
    }, 5000);
}
