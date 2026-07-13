// ============================================
// MÓDULO: falla.js
// Descripción: Gestión de fallas en equipos en comodato
// Patrón: IIFE, fetchWithAuth, esperarElemento, initPaginacion, Swal
// Clave de módulo: comodato/falla
// ============================================

(function () {
    let _registros  = [];
    let _idEliminar = null;
    let _detalles   = [];

    // ── Inicialización ──────────────────────────────
    esperarElemento('fallaBody', async () => {
        await cargarDetalles();
        await listar();
    }, 20, 'comodato/falla');

    // ── Cargar detalles activos para el selector ────
    async function cargarDetalles() {
        try {
            // Trae los detalles con estado entregado/activo que aún no tienen devolución
            const data = await fetchWithAuth('/comodato_detalle');
            _detalles  = Array.isArray(data) ? data : [];

            const sel = document.getElementById('fk_detalle');
            if (!sel) return;

            sel.innerHTML = '<option value="">— Selecciona un equipo —</option>';
            _detalles.forEach(d => {
                const label = `${d.numero_economico || '—'} · ${d.marca || ''} ${d.modelo || ''} (Comodato #${d.fk_comodato})`;
                sel.innerHTML += `<option value="${d.pk_detalle}">${label}</option>`;
            });
        } catch (e) {
            console.error('Error cargando detalles:', e);
        }
    }

    // ── Mostrar info del equipo seleccionado ────────
    window.cargarInfoDetalle = function () {
        const id      = document.getElementById('fk_detalle')?.value;
        const panel   = document.getElementById('infoEquipo');
        if (!panel) return;

        if (!id) { panel.classList.add('d-none'); return; }

        const det = _detalles.find(d => String(d.pk_detalle) === String(id));
        if (!det) { panel.classList.add('d-none'); return; }

        document.getElementById('infoNumEco').textContent = det.numero_economico || '—';
        document.getElementById('infoMarca').textContent  = `${det.marca || ''} ${det.modelo || ''}`.trim() || '—';
        document.getElementById('infoEstado').textContent = det.estado_operativo || '—';
        panel.classList.remove('d-none');
    };

    // ── Listar fallas ───────────────────────────────
    async function listar() {
        const tabla = document.getElementById('fallaBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/falla');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listando fallas:', e);
        }
    }

    // ── Render tabla ────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('fallaBody');
        const footer = document.getElementById('footerInfo');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-triangle-exclamation fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay fallas registradas
                </td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'fallaBody', filasPorPagina: 10, sufijo: 'fa' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((f, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3" style="font-size:13px;">
                    <span class="fw-semibold">${f.numero_economico || '—'}</span>
                    <span class="text-muted ms-1">${f.marca || ''} ${f.modelo || ''}</span>
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${badgeTipo(f.tipo)}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${badgeUrgencia(f.urgencia)}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${badgeEstado(f.estado)}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${f.fecha_reporte ? f.fecha_reporte.substring(0, 10) : f.fecha_registro?.substring(0, 10) || '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalleFalla(${f.pk_falla})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Cambiar estado"
                        onclick="abrirCambioEstado(${f.pk_falla}, '${f.estado}')">
                        <i class="fa-solid fa-rotate" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Cancelar falla"
                        onclick="abrirEliminar(${f.pk_falla}, '${(f.descripcion || '').substring(0, 40).replace(/'/g, "\\'")}…')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'fallaBody', filasPorPagina: 10, sufijo: 'fa' });
    }

    // ── Filtrado dinámico ───────────────────────────
    window.filtrarTabla = function () {
        const q         = (document.getElementById('searchInput')?.value    || '').toLowerCase();
        const estado    = (document.getElementById('filtroEstado')?.value   || '');
        const urgencia  = (document.getElementById('filtroUrgencia')?.value || '');

        renderTabla(_registros.filter(f => {
            const texto = `${f.numero_economico} ${f.marca} ${f.modelo} ${f.tipo} ${f.descripcion}`.toLowerCase();
            return (!q        || texto.includes(q))
                && (!estado   || f.estado   === estado)
                && (!urgencia || f.urgencia === urgencia);
        }));
    };

    // ── Guardar falla ───────────────────────────────
    window.guardarFalla = async function () {
        const fk_detalle  = document.getElementById('fk_detalle').value;
        const tipo        = document.getElementById('tipo').value;
        const urgencia    = document.getElementById('urgencia').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const fecha_reporte  = document.getElementById('fecha_reporte').value  || null;
        const origen         = document.getElementById('origen').value;
        const observaciones  = document.getElementById('observaciones').value.trim() || null;

        if (!fk_detalle) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona el equipo (detalle de comodato).' });
            return;
        }
        if (!tipo) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona el tipo de falla.' });
            return;
        }
        if (!descripcion) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'La descripción es obligatoria.' });
            return;
        }

        try {
            await fetchWithAuth('/falla', 'POST', {
                fk_detalle, tipo, urgencia, descripcion,
                fecha_reporte, origen, observaciones,
                estado: 'pendiente'
            });
            Swal.fire({ icon: 'success', title: 'Falla reportada',
                text: 'La falla fue registrada exitosamente.',
                timer: 2000, showConfirmButton: false });
            mostrarTabla();
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Ver detalle ─────────────────────────────────
    window.verDetalleFalla = async function (id) {
        try {
            const f = await fetchWithAuth(`/falla/${id}`);
            document.getElementById('modalDetalleBody').innerHTML = `
                <div class="row g-3" style="font-size:13px;">
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">EQUIPO</div>
                            <div class="fw-semibold">${f.numero_economico || '—'} · ${f.marca || ''} ${f.modelo || ''}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TIPO</div>
                            <div>${badgeTipo(f.tipo)}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">URGENCIA</div>
                            <div>${badgeUrgencia(f.urgencia)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">ESTADO</div>
                            <div>${badgeEstado(f.estado)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">ORIGEN</div>
                            <div class="text-capitalize">${f.origen || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA REPORTE</div>
                            <div>${f.fecha_reporte ? f.fecha_reporte.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">DESCRIPCIÓN</div>
                            <div>${f.descripcion || '—'}</div>
                        </div>
                    </div>
                    ${f.observaciones ? `
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">OBSERVACIONES</div>
                            <div>${f.observaciones}</div>
                        </div>
                    </div>` : ''}
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</div>
                            <div>${f.registrado_por_usuario || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA REGISTRO</div>
                            <div>${f.fecha_registro ? f.fecha_registro.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                </div>`;
            new bootstrap.Modal(document.getElementById('modalDetalle')).show();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Cambiar estado ──────────────────────────────
    window.abrirCambioEstado = function (id, estadoActual) {
        document.getElementById('estadoFallaId').value = id;
        document.getElementById('nuevoEstado').value   = estadoActual;
        new bootstrap.Modal(document.getElementById('modalEstado')).show();
    };

    window.confirmarCambioEstado = async function () {
        const id     = document.getElementById('estadoFallaId').value;
        const estado = document.getElementById('nuevoEstado').value;
        try {
            await fetchWithAuth(`/falla/${id}/estado`, 'PATCH', { estado });
            bootstrap.Modal.getInstance(document.getElementById('modalEstado')).hide();
            Swal.fire({ icon: 'success', title: 'Estado actualizado',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Eliminar (cancelar) ─────────────────────────
    window.abrirEliminar = function (id, descripcion) {
        _idEliminar = id;
        document.getElementById('eliminarDescripcion').textContent = descripcion;
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/falla/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ icon: 'success', title: 'Falla cancelada',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Helpers de badges ───────────────────────────
    function badgeTipo(tipo) {
        const mapa = {
            mecanica:        ['secondary', 'Mecánica'],
            electrica:       ['warning',   'Eléctrica'],
            hidraulica:      ['info',      'Hidráulica'],
            neumatica:       ['primary',   'Neumática'],
            carroceria:      ['dark',      'Carrocería'],
            operacion:       ['secondary', 'Operación'],
            dano_devolucion: ['danger',    'Daño devolución'],
            otro:            ['light',     'Otro'],
        };
        const [color, label] = mapa[tipo] || ['light', tipo || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

    function badgeUrgencia(urgencia) {
        const mapa = {
            normal:  ['success', 'Normal'],
            alta:    ['warning', 'Alta'],
            critica: ['danger',  'Crítica'],
        };
        const [color, label] = mapa[urgencia] || ['secondary', urgencia || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

    function badgeEstado(estado) {
        const mapa = {
            pendiente:  ['warning',   'Pendiente'],
            en_proceso: ['primary',   'En proceso'],
            resuelto:   ['success',   'Resuelto'],
            cancelado:  ['secondary', 'Cancelado'],
        };
        const [color, label] = mapa[estado] || ['light', estado || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

})();

// ── UI Global (fuera del IIFE para ser accesibles desde HTML) ──
window.mostrarFormulario = function () {
    document.getElementById('pk_falla').value              = '';
    document.getElementById('fk_detalle').value            = '';
    document.getElementById('tipo').value                  = '';
    document.getElementById('urgencia').value              = 'normal';
    document.getElementById('origen').value                = 'comodatos';
    document.getElementById('descripcion').value           = '';
    document.getElementById('observaciones').value         = '';
    document.getElementById('fecha_reporte').value         = '';
    document.getElementById('tituloFormulario').textContent = 'Reportar falla';
    document.getElementById('infoEquipo').classList.add('d-none');

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};