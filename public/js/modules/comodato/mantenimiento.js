// ============================================
// MÓDULO: mantenimiento.js
// Descripción: Gestión de órdenes de mantenimiento en comodatos
// Patrón: IIFE, fetchWithAuth, esperarElemento, initPaginacion, Swal
// Clave de módulo: comodato/mantenimiento
// ============================================

(function () {
    let _registros  = [];
    let _idEliminar = null;
    let _detalles   = [];
    let _fallas     = [];

    // ── Inicialización ──────────────────────────────
    esperarElemento('mantoBody', async () => {
        await Promise.all([cargarDetalles(), cargarFallas()]);
        await listar();
    }, 20, 'comodato/mantenimiento');

    // ── Cargar detalles para el selector ────────────
    async function cargarDetalles() {
        try {
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

    // ── Cargar fallas pendientes para el selector ───
    async function cargarFallas() {
        try {
            const data = await fetchWithAuth('/falla?estado=pendiente');
            _fallas    = Array.isArray(data) ? data : [];

            const sel = document.getElementById('fk_falla');
            if (!sel) return;

            sel.innerHTML = '<option value="">— Sin falla asociada —</option>';
            _fallas.forEach(f => {
                const label = `#${f.pk_falla} · ${f.numero_economico || '—'} · ${f.tipo} — ${(f.descripcion || '').substring(0, 40)}`;
                sel.innerHTML += `<option value="${f.pk_falla}">${label}</option>`;
            });
        } catch (e) {
            console.error('Error cargando fallas:', e);
        }
    }

    // ── Mostrar info del equipo seleccionado ────────
    window.cargarInfoDetalle = function () {
        const id    = document.getElementById('fk_detalle')?.value;
        const panel = document.getElementById('infoEquipo');
        if (!panel) return;

        if (!id) { panel.classList.add('d-none'); return; }

        const det = _detalles.find(d => String(d.pk_detalle) === String(id));
        if (!det)  { panel.classList.add('d-none'); return; }

        document.getElementById('infoNumEco').textContent = det.numero_economico || '—';
        document.getElementById('infoMarca').textContent  = `${det.marca || ''} ${det.modelo || ''}`.trim() || '—';
        document.getElementById('infoEstado').textContent = det.estado_operativo || '—';
        panel.classList.remove('d-none');
    };

    // ── Listar órdenes ──────────────────────────────
    async function listar() {
        const tabla = document.getElementById('mantoBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/mantenimiento');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listando mantenimientos:', e);
        }
    }

    // ── Render tabla ────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('mantoBody');
        const footer = document.getElementById('footerInfo');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-screwdriver-wrench fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay órdenes de mantenimiento registradas
                </td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'mantoBody', filasPorPagina: 10, sufijo: 'mt' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3" style="font-size:13px;">
                    <span class="fw-semibold">${m.numero_economico || '—'}</span>
                    <span class="text-muted ms-1">${m.marca || ''} ${m.modelo || ''}</span>
                </td>
                <td class="px-3 text-center" style="font-size:12px;">${badgeTipo(m.tipo_manto)}</td>
                <td class="px-3 text-center" style="font-size:12px;">${badgeEstado(m.estado)}</td>
                <td class="px-3" style="font-size:12px;">
                    ${m.taller   ? `<div><i class="fa-solid fa-building me-1 text-muted"></i>${m.taller}</div>` : ''}
                    ${m.tecnico  ? `<div><i class="fa-solid fa-user-gear me-1 text-muted"></i>${m.tecnico}</div>` : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${m.fecha_inicio ? m.fecha_inicio.substring(0, 10) : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${m.fecha_fin_estimada ? m.fecha_fin_estimada.substring(0, 10) : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalleMantenimiento(${m.pk_mantenimiento})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    ${m.estado !== 'terminado' && m.estado !== 'cancelado' ? `
                    <button class="btn btn-sm me-1 text-white" style="background:#2d7a4f;font-size:11px;"
                        title="Terminar orden"
                        onclick="abrirTerminar(${m.pk_mantenimiento})">
                        <i class="fa-solid fa-circle-check" style="font-size:11px;"></i>
                    </button>` : ''}
                    ${m.estado !== 'terminado' && m.estado !== 'cancelado' ? `
                    <button class="btn btn-sm btn-outline-danger" title="Cancelar orden"
                        onclick="abrirEliminar(${m.pk_mantenimiento}, '${(m.descripcion || '').substring(0, 40).replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>` : ''}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'mantoBody', filasPorPagina: 10, sufijo: 'mt' });
    }

    // ── Filtrado dinámico ───────────────────────────
    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value  || '').toLowerCase();
        const estado = (document.getElementById('filtroEstado')?.value  || '');
        const tipo   = (document.getElementById('filtroTipo')?.value    || '');

        renderTabla(_registros.filter(m => {
            const texto = `${m.numero_economico} ${m.marca} ${m.modelo} ${m.taller} ${m.tecnico} ${m.descripcion}`.toLowerCase();
            return (!q      || texto.includes(q))
                && (!estado || m.estado    === estado)
                && (!tipo   || m.tipo_manto === tipo);
        }));
    };

    // ── Guardar orden ───────────────────────────────
    window.guardarMantenimiento = async function () {
        const fk_detalle       = document.getElementById('fk_detalle').value;
        const fk_falla         = document.getElementById('fk_falla').value         || null;
        const tipo_manto       = document.getElementById('tipo_manto').value;
        const estado           = document.getElementById('estado').value;
        const descripcion      = document.getElementById('descripcion').value.trim();
        const taller           = document.getElementById('taller').value.trim()           || null;
        const tecnico          = document.getElementById('tecnico').value.trim()          || null;
        const costo_estimado   = document.getElementById('costo_estimado').value          || null;
        const fecha_inicio     = document.getElementById('fecha_inicio').value            || null;
        const fecha_fin_estimada = document.getElementById('fecha_fin_estimada').value    || null;
        const repuestos_usados = document.getElementById('repuestos_usados').value.trim() || null;
        const observaciones    = document.getElementById('observaciones').value.trim()    || null;

        if (!fk_detalle) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona el equipo (detalle de comodato).' });
            return;
        }
        if (!descripcion) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'La descripción del trabajo es obligatoria.' });
            return;
        }

        try {
            await fetchWithAuth('/mantenimiento', 'POST', {
                fk_detalle, fk_falla, tipo_manto, estado, descripcion,
                taller, tecnico, costo_estimado, fecha_inicio,
                fecha_fin_estimada, repuestos_usados, observaciones
            });
            Swal.fire({ icon: 'success', title: 'Orden registrada',
                text: 'La orden de mantenimiento fue emitida exitosamente.',
                timer: 2000, showConfirmButton: false });
            mostrarTabla();
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Ver detalle ─────────────────────────────────
    window.verDetalleMantenimiento = async function (id) {
        try {
            const m = await fetchWithAuth(`/mantenimiento/${id}`);
            document.getElementById('modalDetalleBody').innerHTML = `
                <div class="row g-3" style="font-size:13px;">
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">EQUIPO</div>
                            <div class="fw-semibold">${m.numero_economico || '—'} · ${m.marca || ''} ${m.modelo || ''}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TIPO</div>
                            <div>${badgeTipo(m.tipo_manto)}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">ESTADO</div>
                            <div>${badgeEstado(m.estado)}</div>
                        </div>
                    </div>
                    ${m.falla_descripcion ? `
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#fff8e1;border:1px solid #ffe082;">
                            <div class="text-muted mb-1" style="font-size:11px;">FALLA RELACIONADA</div>
                            <div><span class="badge bg-warning text-dark me-2">${m.falla_tipo || ''}</span>${m.falla_descripcion}</div>
                        </div>
                    </div>` : ''}
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TALLER</div>
                            <div>${m.taller || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TÉCNICO</div>
                            <div>${m.tecnico || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA INICIO</div>
                            <div>${m.fecha_inicio ? m.fecha_inicio.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FIN ESTIMADO</div>
                            <div>${m.fecha_fin_estimada ? m.fecha_fin_estimada.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FIN REAL</div>
                            <div>${m.fecha_fin_real ? m.fecha_fin_real.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">COSTO ESTIMADO</div>
                            <div>${m.costo_estimado ? `$${Number(m.costo_estimado).toLocaleString('es-MX', {minimumFractionDigits:2})}` : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">COSTO REAL</div>
                            <div>${m.costo_real ? `$${Number(m.costo_real).toLocaleString('es-MX', {minimumFractionDigits:2})}` : '—'}</div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">DESCRIPCIÓN</div>
                            <div>${m.descripcion || '—'}</div>
                        </div>
                    </div>
                    ${m.repuestos_usados ? `
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">REPUESTOS</div>
                            <div>${m.repuestos_usados}</div>
                        </div>
                    </div>` : ''}
                    ${m.observaciones ? `
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">OBSERVACIONES</div>
                            <div>${m.observaciones}</div>
                        </div>
                    </div>` : ''}
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</div>
                            <div>${m.registrado_por_usuario || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA REGISTRO</div>
                            <div>${m.fecha_registro ? m.fecha_registro.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                </div>`;
            new bootstrap.Modal(document.getElementById('modalDetalle')).show();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Terminar orden ──────────────────────────────
    window.abrirTerminar = function (id) {
        document.getElementById('terminarId').value            = id;
        document.getElementById('terminarFechaFin').value      = '';
        document.getElementById('terminarCosto').value         = '';
        document.getElementById('terminarRepuestos').value     = '';
        document.getElementById('terminarObservaciones').value = '';
        new bootstrap.Modal(document.getElementById('modalTerminar')).show();
    };

    window.confirmarTerminar = async function () {
        const id           = document.getElementById('terminarId').value;
        const fecha_fin_real  = document.getElementById('terminarFechaFin').value      || null;
        const costo_real      = document.getElementById('terminarCosto').value          || null;
        const repuestos_usados = document.getElementById('terminarRepuestos').value.trim() || null;
        const observaciones    = document.getElementById('terminarObservaciones').value.trim() || null;

        try {
            await fetchWithAuth(`/mantenimiento/${id}/terminar`, 'PATCH', {
                fecha_fin_real, costo_real, repuestos_usados, observaciones
            });
            bootstrap.Modal.getInstance(document.getElementById('modalTerminar')).hide();
            Swal.fire({ icon: 'success', title: 'Mantenimiento terminado',
                text: 'La maquinaria quedó marcada como disponible.',
                timer: 2500, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Cancelar orden ──────────────────────────────
    window.abrirEliminar = function (id, descripcion) {
        _idEliminar = id;
        document.getElementById('eliminarDescripcion').textContent = descripcion || 'Sin descripción';
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/mantenimiento/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ icon: 'success', title: 'Orden cancelada',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Helpers de badges ───────────────────────────
    function badgeTipo(tipo) {
        const mapa = {
            correctivo: ['danger',  'Correctivo'],
            preventivo: ['primary', 'Preventivo'],
            predictivo: ['info',    'Predictivo'],
        };
        const [color, label] = mapa[tipo] || ['secondary', tipo || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

    function badgeEstado(estado) {
        const mapa = {
            programado: ['warning',   'Programado'],
            en_proceso: ['primary',   'En proceso'],
            terminado:  ['success',   'Terminado'],
            cancelado:  ['secondary', 'Cancelado'],
        };
        const [color, label] = mapa[estado] || ['light', estado || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

})();

// ── UI Global ──────────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('pk_mantenimiento').value    = '';
    document.getElementById('fk_detalle').value          = '';
    document.getElementById('fk_falla').value            = '';
    document.getElementById('tipo_manto').value          = 'correctivo';
    document.getElementById('estado').value              = 'programado';
    document.getElementById('descripcion').value         = '';
    document.getElementById('taller').value              = '';
    document.getElementById('tecnico').value             = '';
    document.getElementById('costo_estimado').value      = '';
    document.getElementById('fecha_inicio').value        = '';
    document.getElementById('fecha_fin_estimada').value  = '';
    document.getElementById('repuestos_usados').value    = '';
    document.getElementById('observaciones').value       = '';
    document.getElementById('tituloFormulario').textContent = 'Nueva orden de mantenimiento';
    document.getElementById('infoEquipo').classList.add('d-none');

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};