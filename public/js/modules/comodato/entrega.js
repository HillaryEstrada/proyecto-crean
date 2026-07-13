(function () {
    let _registros       = [];
    let _detalles        = [];
    let _idEliminar      = null;
    let _datosDetalleActual = null;

    esperarElemento('entregaBody', async () => { 
        await cargarDetalles();
        await listar(); 
    }, 20, 'comodato/entrega');

    // ==========================================
    // Cargar detalles disponibles (comodato_detalle)
    // ==========================================
    async function cargarDetalles() {
        try {
            // Endpoint que traiga comodato_detalle con info de maquinaria
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
    window.cargarDetalleEntrega = async function () {
        const selector = document.getElementById('fk_detalle');
        const fk_detalle = selector.value;
        
        if (!fk_detalle) {
            _datosDetalleActual = null;
            return;
        }

        try {
            const data = await fetchWithAuth(`/entrega/detalle/${fk_detalle}`);
            
            // Si ya existe entrega para este detalle, mostrar error
            if (data && data[0]) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Entrega Existente',
                    text: 'Ya existe una entrega registrada para este detalle.'
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
    // Listar entregas
    // ==========================================
    async function listar() {
        const tabla = document.getElementById('entregaBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/entrega');
            _registros = data || [];
            renderTabla(data || []);
        } catch (e) { console.error('Error listar entregas:', e); }
    }

    // ==========================================
    // Renderizar tabla
    // ==========================================
    function renderTabla(data) {
        const tabla  = document.getElementById('entregaBody');
        const footer = document.getElementById('footerInfo');
        
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-box-open fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay entregas registradas</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'entregaBody', filasPorPagina: 10, sufijo: 'entrega' });
            return;
        }

        if (footer) footer.textContent = 
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((e, i) => {
            const fechaEntrega = e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString() : '—';
            const motorBadge = getBadgeEstado(e.estado_motor);
            const llantas = e.estado_llantas || '—';
            const rayonesBadge = e.rayones ? '<span class="badge bg-warning text-dark">Sí</span>' : 
                                           '<span class="badge bg-success">No</span>';

            return `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3" style="font-size:13px;">
                        ${e.numero_economico || '—'}<br>
                        <small class="text-muted">${e.marca || ''} ${e.modelo || ''}</small>
                    </td>
                    <td class="px-3" style="font-size:13px;">
                        <strong>${e.nombre_receptor || '—'}</strong><br>
                        <small class="text-muted">${e.cargo_receptor || ''}</small>
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${fechaEntrega}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${motorBadge}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${llantas}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${rayonesBadge}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Ver detalles"
                            onclick="verDetallesEntrega(${e.pk_entrega})">
                            <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                            onclick="abrirEliminar(${e.pk_entrega}, '${(e.numero_economico || 'Entrega').replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'entregaBody', filasPorPagina: 10, sufijo: 'entrega' });
    }

    // Helper: Badge para estado
    function getBadgeEstado(estado) {
        if (!estado) return '—';
        const colores = {
            'bueno': 'success',
            'regular': 'warning',
            'malo': 'danger'
        };
        const color = colores[estado] || 'secondary';
        return `<span class="badge bg-${color}">${estado}</span>`;
    }

    // ==========================================
    // Filtrar tabla
    // ==========================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estadoMotor = document.getElementById('filtroEstadoMotor')?.value || '';
        const conRayones = document.getElementById('filtroRayones')?.checked || false;

        let resultado = _registros.filter(e => {
            // Búsqueda por texto
            const matchTexto = 
                (e.nombre_receptor || '').toLowerCase().includes(q) ||
                (e.numero_economico || '').toLowerCase().includes(q) ||
                (e.marca || '').toLowerCase().includes(q) ||
                (e.modelo || '').toLowerCase().includes(q);

            // Filtro por estado motor
            const matchMotor = !estadoMotor || e.estado_motor === estadoMotor;

            // Filtro por rayones
            const matchRayones = !conRayones || e.rayones === true;

            return matchTexto && matchMotor && matchRayones;
        });

        renderTabla(resultado);
    };

    // ==========================================
    // Mostrar/Ocultar descripción de rayones
    // ==========================================
    document.addEventListener('change', function (e) {
        if (e.target.id === 'rayones') {
            const container = document.getElementById('containerDescRayones');
            if (container) {
                container.style.display = e.target.checked ? 'block' : 'none';
            }
        }
    });

    // ==========================================
    // Guardar entrega (POST)
    // ==========================================
    window.guardarEntrega = async function () {
        const fk_detalle = document.getElementById('fk_detalle').value.trim();
        const fecha_entrega = document.getElementById('fecha_entrega').value.trim();
        const nombre_receptor = document.getElementById('nombre_receptor').value.trim();

        // Validar campos requeridos
        if (!fk_detalle) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona un detalle' });
            return;
        }
        if (!fecha_entrega) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'La fecha de entrega es obligatoria' });
            return;
        }
        if (!nombre_receptor) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El nombre del receptor es obligatorio' });
            return;
        }

        const payload = {
            fk_detalle: parseInt(fk_detalle),
            fecha_entrega: document.getElementById('fecha_entrega').value,
            nombre_receptor: nombre_receptor,
            cargo_receptor: document.getElementById('cargo_receptor').value.trim() || null,
            ubicacion_entrega: document.getElementById('ubicacion_entrega').value.trim() || null,
            fotos_entrega: document.getElementById('fotos_entrega').value.trim() || null,
            estado_motor: document.getElementById('estado_motor').value,
            estado_llantas: document.getElementById('estado_llantas').value,
            estado_asiento: document.getElementById('estado_asiento').value,
            nivel_combustible: document.getElementById('nivel_combustible').value,
            rayones: document.getElementById('rayones').checked,
            descripcion_rayones: document.getElementById('descripcion_rayones').value.trim() || null,
            piezas_faltantes: document.getElementById('piezas_faltantes').value.trim() || null,
            observaciones_checklist: document.getElementById('observaciones_checklist').value.trim() || null
        };

        try {
            await fetchWithAuth('/entrega', 'POST', payload);
            Swal.fire({ 
                icon: 'success', 
                title: 'Registrada',
                text: 'Entrega registrada exitosamente',
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
    // Ver detalles de entrega (solo lectura)
    // ==========================================
    window.verDetallesEntrega = async function (id) {
        try {
            const data = await fetchWithAuth(`/entrega/${id}`);
            if (!data) return;

            const e = data;
            const detalle = `
                <div class="text-start">
                    <p><strong>Máquina:</strong> ${e.numero_economico} (${e.marca} ${e.modelo})</p>
                    <p><strong>Receptor:</strong> ${e.nombre_receptor} (${e.cargo_receptor || 'N/A'})</p>
                    <p><strong>Fecha Entrega:</strong> ${new Date(e.fecha_entrega).toLocaleString()}</p>
                    <p><strong>Ubicación:</strong> ${e.ubicacion_entrega || 'N/A'}</p>
                    <hr>
                    <p><strong>Motor:</strong> ${e.estado_motor} | <strong>Llantas:</strong> ${e.estado_llantas} | <strong>Asiento:</strong> ${e.estado_asiento}</p>
                    <p><strong>Combustible:</strong> ${e.nivel_combustible} | <strong>Rayones:</strong> ${e.rayones ? 'Sí' : 'No'}</p>
                    ${e.descripcion_rayones ? `<p><strong>Descripción Rayones:</strong> ${e.descripcion_rayones}</p>` : ''}
                    ${e.piezas_faltantes ? `<p><strong>Piezas Faltantes:</strong> ${e.piezas_faltantes}</p>` : ''}
                    ${e.observaciones_checklist ? `<p><strong>Observaciones:</strong> ${e.observaciones_checklist}</p>` : ''}
                </div>
            `;

            Swal.fire({
                title: 'Detalles de Entrega',
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
            await fetchWithAuth(`/entrega/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ 
                icon: 'success', 
                title: 'Eliminada',
                text: 'Entrega eliminada exitosamente',
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
    document.getElementById('pk_entrega').value = '';
    document.getElementById('fk_detalle').value = '';
    document.getElementById('fecha_entrega').value = '';
    document.getElementById('nombre_receptor').value = '';
    document.getElementById('cargo_receptor').value = '';
    document.getElementById('ubicacion_entrega').value = '';
    document.getElementById('fotos_entrega').value = '';
    document.getElementById('estado_motor').value = 'bueno';
    document.getElementById('estado_llantas').value = 'bueno';
    document.getElementById('estado_asiento').value = 'bueno';
    document.getElementById('nivel_combustible').value = 'lleno';
    document.getElementById('rayones').checked = false;
    document.getElementById('descripcion_rayones').value = '';
    document.getElementById('piezas_faltantes').value = '';
    document.getElementById('observaciones_checklist').value = '';
    
    document.getElementById('containerDescRayones').style.display = 'none';
    document.getElementById('tituloFormulario').textContent = 'Nueva entrega';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};