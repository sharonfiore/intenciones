const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzhjP_6H1q_sGNyWIshuz4AHv_E5oZLqyTnmVrgkz0JHAKEa9t4B-8uzVpNRtypIK-R/exec";

// --- 
const loader = document.getElementById('loader');
function mostrarLoader() { loader.classList.remove('d-none'); }
function ocultarLoader() { loader.classList.add('d-none'); }
function mostrarAlerta(mensaje, tipo = 'success') {
    const contenedor = document.querySelector('main');
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show fixed-top m-4`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    contenedor.prepend(alerta);
    setTimeout(() => alerta.remove(), 5000);
}

// --- NUEVA FUNCIÓN PARA CARGAR DATOS DEL DASHBOARD ---
function loadDashboardData() {
    const statTodayEl = document.getElementById('stat-today');
    const statWeekEl = document.getElementById('stat-week');
    const misasListEl = document.getElementById('dashboard-misas-list');
    
    fetch(`${WEB_APP_URL}?action=getDashboardStats`)
        .then(res => res.json())
        .then(stats => {
            statTodayEl.textContent = stats.intencionesHoy;
            statWeekEl.textContent = stats.intencionesSemana;

            misasListEl.innerHTML = ''; // Limpiar
            const misas = stats.misasHoy;

            if (Object.keys(misas).length === 0) {
                misasListEl.innerHTML = '<p class="text-center text-muted mt-3">No hay misas con intenciones registradas para hoy.</p>';
                return;
            }

            // Ordenar las horas
            const horasOrdenadas = Object.keys(misas).sort();

            horasOrdenadas.forEach(hora => {
                const count = misas[hora];
                const misaItem = document.createElement('div');
                misaItem.className = 'misa-item';
                misaItem.innerHTML = `
                    <div>
                        <i class="bi bi-clock me-2"></i>
                        <strong>${hora}</strong>
                    </div>
                    <span class="badge bg-primary rounded-pill">${count} ${count === 1 ? 'intención' : 'intenciones'}</span>
                `;
                misasListEl.appendChild(misaItem);
            });
        })
        .catch(err => {
            misasListEl.innerHTML = '<p class="text-danger">No se pudo cargar la información.</p>';
            console.error(err);
        });
}

// --- NAVEGACIÓN (sin cambios) ---
const vistas = ['dashboard', 'registro', 'reportes'];
const navLinks = document.querySelectorAll('.nav-link');
function mostrarVista(idVista, subvista = null) {
     vistas.forEach(id => { document.getElementById(id).classList.add('d-none'); });
      document.getElementById(idVista).classList.remove('d-none');
      navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.textContent.toLowerCase().includes(idVista)) { link.classList.add('active'); }
      });
      if (idVista === 'registro' && subvista) {
        const tabTrigger = document.querySelector(`#pills-${subvista}-tab`);
        if (tabTrigger) { new bootstrap.Tab(tabTrigger).show(); }
      }
      window.scrollTo(0, 0);
}

// --- LÓGICA DE LA APLICACIÓN ---
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-rapido').value = today;
    document.getElementById('fecha-inicio-prog').value = today;
    document.getElementById('fecha-fin-prog').value = today;
    document.getElementById('fecha-reporte').value = today;
    actualizarHorasMisa(today, 'hora-rapido');
    actualizarHorasMisa(today, 'hora-reporte');
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

// --- EVENT LISTENERS (CON LA CORRECCIÓN) ---
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData(); 
    
    setTodayDate();
    document.getElementById('fecha-rapido').addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-rapido'));
    document.getElementById('fecha-reporte').addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-reporte'));

    // Formulario de Registro Rápido
    document.getElementById('form-rapido').addEventListener('submit', (e) => {
        e.preventDefault();
        mostrarLoader();
        const payload = {
            action: 'registrarRapido',
            data: {
                fecha: document.getElementById('fecha-rapido').value,
                hora: document.getElementById('hora-rapido').value,
                categoria: document.getElementById('categoria-rapido').value,
                intenciones: document.getElementById('intenciones-rapido').value
            }
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
            // Ya no especificamos el header 'Content-Type'. Dejar que el navegador lo maneje, 
            // o a menudo se envía como text/plain, lo cual evita el problema de CORS preflight.
        })
        .then(res => res.json())
        .then(response => {
            ocultarLoader();
            if (response.status === 'ok') {
                mostrarAlerta(response.message, 'success');
                document.getElementById('form-rapido').reset();
                setTodayDate();
            } else {
                mostrarAlerta(response.message, 'danger');
            }
        })
        .catch(err => {
            ocultarLoader();
            mostrarAlerta('Error inesperado: ' + err, 'danger');
        });
    });

    // Formulario de Intención Programada
    document.getElementById('form-programado').addEventListener('submit', (e) => {
        e.preventDefault();
        mostrarLoader();
        const diasSeleccionados = Array.from(document.querySelectorAll('#dias-semana-checks input:checked')).map(cb => cb.value);
        const payload = {
            action: 'registrarProgramado',
            data: {
                fechaInicio: document.getElementById('fecha-inicio-prog').value,
                fechaFin: document.getElementById('fecha-fin-prog').value,
                hora: document.getElementById('hora-prog').value,
                categoria: document.getElementById('categoria-prog').value,
                intencion: document.getElementById('intencion-prog').value,
                nota: document.getElementById('nota-prog').value,
                dias: diasSeleccionados,
                excluirDomingos: document.getElementById('excluir-domingos-prog').checked
            }
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(response => {
            ocultarLoader();
            if (response.status === 'ok') {
                mostrarAlerta(response.message, 'success');
                document.getElementById('form-programado').reset();
                setTodayDate();
            } else {
                mostrarAlerta(response.message, response.status === 'info' ? 'info' : 'danger');
            }
        })
        .catch(err => {
            ocultarLoader();
            mostrarAlerta('Error inesperado: ' + err, 'danger');
        });
    });

    // Lógica de Consultas y Reportes
    const fechaReporteInput = document.getElementById('fecha-reporte');
    const horaReporteSelect = document.getElementById('hora-reporte');
    const resultadoConsulta = document.getElementById('resultado-consulta');
    const contador = document.getElementById('contador-intenciones');
    
    function consultarIntenciones() {
        const fecha = fechaReporteInput.value;
        if (!fecha) return;
        mostrarLoader();

        fetch(`${WEB_APP_URL}?action=getIntenciones&fecha=${fecha}`)
            .then(res => res.json())
            .then(intenciones => {
                ocultarLoader();
                resultadoConsulta.innerHTML = '';
                contador.textContent = intenciones.length;
                if (intenciones.length === 0) {
                    resultadoConsulta.innerHTML = '<p class="text-muted">No se encontraron intenciones para esta fecha.</p>';
                } else {
                    const ul = document.createElement('ul');
                    ul.className = 'list-group';
                    intenciones.forEach(i => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item';
                        li.innerHTML = `<strong>${i.intencion}</strong> ${i.nota || ''} <br><small class="text-muted">${i.categoria} - ${i.horaMisa} ${i.tipo === 'Programada' ? '<span class="badge bg-secondary">Programada</span>' : ''}</small>`;
                        ul.appendChild(li);
                    });
                    resultadoConsulta.appendChild(ul);
                }
            })
            .catch(err => {
                ocultarLoader();
                mostrarAlerta('Error al consultar: ' + err, 'danger');
            });
    }
    
    fechaReporteInput.addEventListener('change', consultarIntenciones);
    setTimeout(consultarIntenciones, 500);

    document.getElementById('btn-generar-reporte').addEventListener('click', () => {
        const fecha = fechaReporteInput.value;
        const hora = horaReporteSelect.value;
        if (!fecha || !hora) {
            return mostrarAlerta('Debes seleccionar una fecha y hora.', 'warning');
        }
        mostrarLoader();
        const payload = {
            action: 'generarDocumento',
            data: { fecha, hora }
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(response => {
            ocultarLoader();
            if(response.status === 'ok') {
                mostrarAlerta(`Documento '${response.name}' generado. <a href="${response.url}" target="_blank" class="alert-link"><strong>Abrir Documento</strong></a>`, 'success');
            } else {
                mostrarAlerta('Error al generar el documento.', 'danger');
            }
        })
        .catch(err => {
            ocultarLoader();
            mostrarAlerta('Error inesperado: ' + err, 'danger');
        });
    });
});
