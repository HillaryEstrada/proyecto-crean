(function () {
    let _registros       = [];
    let _detalles        = [];
    let _idEliminar      = null;
    let _datosDetalleActual = null;

    esperarElemento('devolucionBody', async () => { 
        await cargarDetalles();
        await listar(); 
    }, 20, 'comodato/devolucion');

    // ==========================================
    // Cargar detalles disponibles (comodato_detalle)
    // ==========================================
    async function cargarDetalles() {
        try {
            // Endpoint que traiga comodato_detalle con info de maquinaria
            // Solo mostrar detalles que tengan entrega pero no devolución
            const data = await fetchWithAuth('/comodato_detalle');
            _detalles = data || [];
            
            const selector = document.getElementById('fk_detalle');
            if (selector) {
                selector.innerHTML = '<option value="">-- Seleccionar detalle --</option>' +
                    _detalles.map(d => 
                        `<option value="${d.pk_detalle}" data-maquina="${d.fk_maquinaria}">
                            [#${d.pk_detalle}] ${d.numero_economico || 'Sin ID'} - ${d.marca || ''} ${d.modelo || ''}
                        </option>`
                    ).join('');
            }
        } catch (e) { 
            console.error('Error cargar detalles:', e); 
        }
    }

    // ==========================================
    // Cargar datos del detalle seleccionado
    // ==========================================
    window.cargarDetalleDevolucion = async function () {
        const selector = document.getElementById('fk_detalle');
        const fk_detalle = selector.value;
        
        if (!fk_detalle) {
            _datosDetalleActual = null;
            return;
        }

        try {
            // Verificar si ya existe devolución para este detalle
            const data = await fetchWithAuth(`/devolucion/detalle/${fk_detalle}`);
            
            if (data && data[0]) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Devolución Existente',
                    text: 'Ya existe una devolución registrada para este detalle.'
                });
                selector.value = '';
                return;
            }

            // Traer el detalle completo del comodato
            const detalleData = _detalles.find(d => d.pk_detalle === parseInt(fk_detalle));
            if (detalleData) {
                _datosDetalleActual = detalleData;
                console.log('Detalle cargado:', _datosDetalleActual);
            }
        } catch (e) {
            console.error('Error cargar detalle:', e);
        }
    };

    // ==========================================
    // Mostrar/ocultar descripción de daños
    // ==========================================
    window.mostrarDescDanos = function () {
        const container = document.getElementById('containerDescDanos');
        const checked = document.getElementById('tiene_danos').checked;
        if (container) {
            container.style.display = checked ? 'block' : 'none';
        }
    };

    // ==========================================
    // Listar devoluciones
    // ==========================================
    async function listar() {
        const tabla = document.getElementById('devolucionBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/devolucion');
            _registros = data || [];
            renderTabla(data || []);
        } catch (e) { console.error('Error listar devoluciones:', e); }
    }

    // ==========================================
    // Renderizar tabla
    // ==========================================
    function renderTabla(data) {
        const tabla  = document.getElementById('devolucionBody');
        const footer = document.getElementById('footerInfo');
        
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-undo fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay devoluciones registradas</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'devolucionBody', filasPorPagina: 10, sufijo: 'devolucion' });
            return;
        }

        if (footer) footer.textContent = 
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((d, i) => {
            const fechaDevolucion = d.fecha_devolucion ? new Date(d.fecha_devolucion).toLocaleDateString() : '—';
            const horas = d.horas_lectura_horometro || '—';
            const danosBadge = d.tiene_danos ? '<span class="badge bg-danger">Sí</span>' : 
                                              '<span class="badge bg-success">No</span>';
            const cierreBadge = getBadgeCierre(d.estado_cierre);
            const tipoBadge = d.tipo_devolucion === 'voluntaria' ? 
                              '<span class="badge bg-info">Voluntaria</span>' :
                              '<span class="badge bg-warning text-dark">Recuperación</span>';

            return `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3" style="font-size:13px;">
                        ${d.numero_economico || '—'}<br>
                        <small class="text-muted">${d.marca || ''} ${d.modelo || ''}</small>
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${tipoBadge}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${fechaDevolucion}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${horas}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${danosBadge}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${cierreBadge}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Ver detalles"
                            onclick="verDetallesDevolucion(${d.pk_devolucion})">
                            <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                            onclick="abrirEliminar(${d.pk_devolucion}, '${(d.numero_economico || 'Devolución').replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'devolucionBody', filasPorPagina: 10, sufijo: 'devolucion' });
    }

    // Helper: Badge para estado de cierre
    function getBadgeCierre(estado) {
        if (!estado) return '—';
        const colores = {
            'conforme': 'success',
            'con_danos': 'danger',
            'garantia': 'warning',
            'taller_externo': 'info'
        };
        const color = colores[estado] || 'secondary';
        const etiqueta = {
            'conforme': 'Conforme',
            'con_danos': 'Con Daños',
            'garantia': 'Garantía',
            'taller_externo': 'Taller Ext.'
        }[estado] || estado;
        return `<span class="badge bg-${color}">${etiqueta}</span>`;
    }

    // ==========================================
    // Filtrar tabla
    // ==========================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipo')?.value || '';
        const estadoCierre = document.getElementById('filtroEstadoCierre')?.value || '';
        const conDanos = document.getElementById('filtroDanos')?.checked || false;

        let resultado = _registros.filter(d => {
            // Búsqueda por texto
            const matchTexto = 
                (d.numero_economico || '').toLowerCase().includes(q) ||
                (d.marca || '').toLowerCase().includes(q) ||
                (d.modelo || '').toLowerCase().includes(q);

            // Filtro por tipo
            const matchTipo = !tipo || d.tipo_devolucion === tipo;

            // Filtro por estado cierre
            const matchCierre = !estadoCierre || d.estado_cierre === estadoCierre;

            // Filtro por daños
            const matchDanos = !conDanos || d.tiene_danos === true;

            return matchTexto && matchTipo && matchCierre && matchDanos;
        });

        renderTabla(resultado);
    };

    // ==========================================
    // Guardar devolución (POST)
    // ==========================================
    window.guardarDevolucion = async function () {
        const fk_detalle = document.getElementById('fk_detalle').value.trim();
        const fecha_devolucion = document.getElementById('fecha_devolucion').value.trim();
        const estado_cierre = document.getElementById('estado_cierre').value.trim();

        // Validar campos requeridos
        if (!fk_detalle) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona un detalle' });
            return;
        }
        if (!fecha_devolucion) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'La fecha de devolución es obligatoria' });
            return;
        }
        if (!estado_cierre) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El estado de cierre es obligatorio' });
            return;
        }

        const payload = {
            fk_detalle: parseInt(fk_detalle),
            fecha_devolucion: document.getElementById('fecha_devolucion').value,
            tipo_devolucion: document.getElementById('tipo_devolucion').value || 'voluntaria',
            horas_lectura_horometro: parseInt(document.getElementById('horas_lectura_horometro').value) || null,
            tiene_danos: document.getElementById('tiene_danos').checked,
            requiere_mantenimiento: document.getElementById('requiere_mantenimiento').checked,
            estado_cierre: estado_cierre,
            estado_motor: document.getElementById('estado_motor').value || null,
            estado_llantas: document.getElementById('estado_llantas').value || null,
            nivel_combustible: document.getElementById('nivel_combustible').value || null,
            rayones_nuevos: document.getElementById('rayones_nuevos').checked,
            descripcion_danos: document.getElementById('descripcion_danos').value.trim() || null,
            foto_tablero: document.getElementById('foto_tablero').value.trim() || null,
            fotos_devolucion: document.getElementById('fotos_devolucion').value.trim() || null,
            observaciones: document.getElementById('observaciones').value.trim() || null
        };

        try {
            await fetchWithAuth('/devolucion', 'POST', payload);
            Swal.fire({ 
                icon: 'success', 
                title: 'Registrada',
                text: 'Devolución registrada exitosamente',
                timer: 2000, 
                showConfirmButton: false 
            });
            mostrarTabla();
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ==========================================
    // Ver detalles de devolución (solo lectura)
    // ==========================================
    window.verDetallesDevolucion = async function (id) {
        try {
            const data = await fetchWithAuth(`/devolucion/${id}`);
            if (!data) return;

            const d = data;
            const detalle = `
                <div class="text-start">
                    <h6 class="fw-bold mb-2">Máquina</h6>
                    <p><strong>${d.numero_economico}</strong> (${d.marca} ${d.modelo})</p>
                    
                    <hr>
                    
                    <h6 class="fw-bold mb-2">Devolución</h6>
                    <p><strong>Tipo:</strong> ${d.tipo_devolucion} | <strong>Fecha:</strong> ${new Date(d.fecha_devolucion).toLocaleString()}</p>
                    <p><strong>Horas Lectura:</strong> ${d.horas_lectura_horometro || 'N/A'}</p>
                    <p><strong>Estado Cierre:</strong> ${d.estado_cierre}</p>
                    
                    <hr>
                    
                    <h6 class="fw-bold mb-2">Condiciones</h6>
                    <p><strong>Motor:</strong> ${d.estado_motor || 'Sin evaluar'} | <strong>Llantas:</strong> ${d.estado_llantas || 'Sin evaluar'} | <strong>Combustible:</strong> ${d.nivel_combustible || 'Sin evaluar'}</p>
                    <p><strong>Rayones Nuevos:</strong> ${d.rayones_nuevos ? 'Sí' : 'No'}</p>
                    <p><strong>Tiene Daños:</strong> ${d.tiene_danos ? 'Sí' : 'No'} | <strong>Requiere Manto:</strong> ${d.requiere_mantenimiento ? 'Sí' : 'No'}</p>
                    
                    ${d.descripcion_danos ? `
                    <hr>
                    <h6 class="fw-bold mb-2">Descripción de Daños</h6>
                    <p>${d.descripcion_danos}</p>
                    ` : ''}
                    
                    ${d.observaciones ? `
                    <hr>
                    <h6 class="fw-bold mb-2">Observaciones</h6>
                    <p>${d.observaciones}</p>
                    ` : ''}
                </div>
            `;

            Swal.fire({
                title: 'Detalles de Devolución',
                html: detalle,
                icon: 'info',
                confirmButtonColor: '#1a3c5e'
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ==========================================
    // Abrir modal de eliminación
    // ==========================================
    window.abrirEliminar = function (id, maquina) {
        _idEliminar = id;
        document.getElementById('eliminarMaquina').textContent = maquina;
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    // ==========================================
    // Confirmar eliminación
    // ==========================================
    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/devolucion/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ 
                icon: 'success', 
                title: 'Eliminada',
                text: 'Devolución eliminada exitosamente',
                timer: 2000, 
                showConfirmButton: false 
            });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();

// ── UI Global ─────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('pk_devolucion').value = '';
    document.getElementById('fk_detalle').value = '';
    document.getElementById('fecha_devolucion').value = '';
    document.getElementById('tipo_devolucion').value = 'voluntaria';
    document.getElementById('horas_lectura_horometro').value = '';
    document.getElementById('tiene_danos').checked = false;
    document.getElementById('requiere_mantenimiento').checked = false;
    document.getElementById('estado_cierre').value = 'conforme';
    document.getElementById('estado_motor').value = '';
    document.getElementById('estado_llantas').value = '';
    document.getElementById('nivel_combustible').value = '';
    document.getElementById('rayones_nuevos').checked = false;
    document.getElementById('descripcion_danos').value = '';
    document.getElementById('foto_tablero').value = '';
    document.getElementById('fotos_devolucion').value = '';
    document.getElementById('observaciones').value = '';
    
    document.getElementById('containerDescDanos').style.display = 'none';
    document.getElementById('tituloFormulario').textContent = 'Nueva devolución';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};