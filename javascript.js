<script>
  // UTILIDADES
  const loader = document.getElementById('loader');

  function mostrarLoader() {
    loader.classList.remove('d-none');
  }

  function ocultarLoader() {
    loader.classList.add('d-none');
  }
  
  function mostrarAlerta(mensaje, tipo = 'success') {
    const contenedor = document.querySelector('main');
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show fixed-top m-4`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    contenedor.prepend(alerta);
    setTimeout(() => alerta.remove(), 5000);
  }

  // NAVEGACIÓN
  const vistas = ['dashboard', 'registro', 'reportes'];
  const navLinks = document.querySelectorAll('.nav-link');

  function mostrarVista(idVista, subvista = null) {
      vistas.forEach(id => {
          document.getElementById(id).classList.add('d-none');
      });
      document.getElementById(idVista).classList.remove('d-none');

      // Actualizar links activos
      navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.textContent.toLowerCase().includes(idVista)) {
              link.classList.add('active');
          }
      });

      // Si se especifica una subvista (ej. registro rápido)
      if (idVista === 'registro' && subvista) {
        const tabTrigger = document.querySelector(`#pills-${subvista}-tab`);
        if (tabTrigger) {
          const tab = new bootstrap.Tab(tabTrigger);
          tab.show();
        }
      }
      window.scrollTo(0, 0); // Ir al inicio de la página
  }
  
  // LÓGICA DE FORMULARIOS

  // Llenar la fecha de hoy por defecto
  function setTodayDate() {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('fecha-rapido').value = today;
      document.getElementById('fecha-inicio-prog').value = today;
      document.getElementById('fecha-fin-prog').value = today;
      document.getElementById('fecha-reporte').value = today;
      
      // Cargar horas de misa para el día de hoy
      actualizarHorasMisa(today, 'hora-rapido');
      actualizarHorasMisa(today, 'hora-reporte');
  }

  // Actualizar las horas de misa disponibles según la fecha
  function actualizarHorasMisa(fechaStr, selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = ''; // Limpiar opciones
    if (!fechaStr) return;
    google.script.run
        .withSuccessHandler(horas => {
            horas.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                select.appendChild(option);
            });
        })
        .withFailureHandler(err => mostrarAlerta('Error al cargar horas: ' + err.message, 'danger'))
        .getHorasMisa(fechaStr);
  }
  
  // EVENT LISTENERS
  document.addEventListener('DOMContentLoaded', () => {
    setTodayDate();

    // Actualizar horas de misa cuando cambia la fecha
    document.getElementById('fecha-rapido').addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-rapido'));
    document.getElementById('fecha-reporte').addEventListener('change', (e) => actualizarHorasMisa(e.target.value, 'hora-reporte'));


    // Formulario de Registro Rápido
    document.getElementById('form-rapido').addEventListener('submit', (e) => {
      e.preventDefault();
      mostrarLoader();
      const data = {
        fecha: document.getElementById('fecha-rapido').value,
        hora: document.getElementById('hora-rapido').value,
        categoria: document.getElementById('categoria-rapido').value,
        intenciones: document.getElementById('intenciones-rapido').value
      };
      
      google.script.run
        .withSuccessHandler(response => {
          ocultarLoader();
          if(response.status === 'ok') {
            mostrarAlerta(response.message, 'success');
            document.getElementById('form-rapido').reset();
            setTodayDate();
          } else {
            mostrarAlerta(response.message, 'danger');
          }
        })
        .withFailureHandler(err => {
            ocultarLoader();
            mostrarAlerta('Error inesperado: ' + err.message, 'danger');
        })
        .registrarIntencionesRapido(data);
    });

    // Formulario de Intención Programada
    document.getElementById('form-programado').addEventListener('submit', (e) => {
        e.preventDefault();
        mostrarLoader();

        const diasSeleccionados = Array.from(document.querySelectorAll('#dias-semana-checks input:checked')).map(cb => cb.value);

        const data = {
            fechaInicio: document.getElementById('fecha-inicio-prog').value,
            fechaFin: document.getElementById('fecha-fin-prog').value,
            hora: document.getElementById('hora-prog').value,
            categoria: document.getElementById('categoria-prog').value,
            intencion: document.getElementById('intencion-prog').value,
            nota: document.getElementById('nota-prog').value,
            dias: diasSeleccionados,
            excluirDomingos: document.getElementById('excluir-domingos-prog').checked
        };
        
        google.script.run
            .withSuccessHandler(response => {
                ocultarLoader();
                if (response.status === 'ok') {
                    mostrarAlerta(response.message, 'success');
                    document.getElementById('form-programado').reset();
                    setTodayDate();
                } else {
                    mostrarAlerta(response.message, response.status === 'info' ? 'info' : 'danger');
                }
            })
            .withFailureHandler(err => {
                ocultarLoader();
                mostrarAlerta('Error inesperado: ' + err.message, 'danger');
            })
            .registrarIntencionProgramada(data);
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
        google.script.run
            .withSuccessHandler(intenciones => {
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
                        li.innerHTML = `
                            <strong>${i.intencion}</strong> ${i.nota || ''} <br>
                            <small class="text-muted">${i.categoria} - ${i.horaMisa} ${i.tipo === 'Programada' ? '<span class="badge bg-secondary">Programada</span>' : ''}</small>
                        `;
                        ul.appendChild(li);
                    });
                    resultadoConsulta.appendChild(ul);
                }
            })
            .withFailureHandler(err => {
                ocultarLoader();
                mostrarAlerta('Error al consultar: ' + err.message, 'danger');
            })
            .getIntencionesPorFecha(fecha);
    }
    
    fechaReporteInput.addEventListener('change', consultarIntenciones);
    // Para que cargue al inicio
    setTimeout(consultarIntenciones, 500); // Pequeño delay para que se carguen las horas primero

    document.getElementById('btn-generar-reporte').addEventListener('click', () => {
        const fecha = fechaReporteInput.value;
        const hora = horaReporteSelect.value;
        if (!fecha || !hora) {
            mostrarAlerta('Debes seleccionar una fecha y hora para generar el reporte.', 'warning');
            return;
        }

        mostrarLoader();
        google.script.run
            .withSuccessHandler(response => {
                ocultarLoader();
                if(response.status === 'ok') {
                    mostrarAlerta(`Documento '${response.name}' generado. <a href="${response.url}" target="_blank"><strong>Abrir Documento</strong></a>`, 'success');
                } else {
                    mostrarAlerta('Error al generar el documento.', 'danger');
                }
            })
            .withFailureHandler(err => {
                ocultarLoader();
                mostrarAlerta('Error inesperado: ' + err.message, 'danger');
            })
            .generarDocumento(fecha, hora);
    });
  });
</script>
