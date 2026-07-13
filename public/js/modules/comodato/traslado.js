// ============================================
// MÓDULO: traslado.js
// Descripción: Gestión de traslados en comodatos
// Patrón: IIFE, fetchWithAuth, esperarElemento, initPaginacion, Swal
// Clave de módulo: comodato/traslado
// ============================================

(function () {
    let _registros   = [];
    let _idEliminar  = null;
    let _comodatos   = [];
    let _vehiculos   = [];

    // ── Inicialización ──────────────────────────────
    esperarElemento('trasladoBody', async () => {
        await Promise.all([cargarComodatos(), cargarVehiculos()]);
        await listar();
    }, 20, 'comodato/traslado');

    // ── Cargar comodatos activos ─────────────────────
    async function cargarComodatos() {
        try {
            const data  = await fetchWithAuth('/comodato');
            _comodatos  = Array.isArray(data) ? data : [];

            const sel = document.getElementById('fk_comodato');
            if (!sel) return;

            sel.innerHTML = '<option value="">— Selecciona un comodato —</option>';
            _comodatos.forEach(c => {
                const label = `#${c.pk_comodato} · ${c.cultivo || 'Sin cultivo'} (${c.estado || ''})`;
                sel.innerHTML += `<option value="${c.pk_comodato}">${label}</option>`;
            });
        } catch (e) {
            console.error('Error cargando comodatos:', e);
        }
    }

    // ── Cargar vehículos disponibles ─────────────────
    async function cargarVehiculos() {
        try {
            const data  = await fetchWithAuth('/vehiculo');
            _vehiculos  = Array.isArray(data) ? data : [];

            const sel = document.getElementById('fk_vehiculo');
            if (!sel) return;

            sel.innerHTML = '<option value="">— Sin vehículo asignado —</option>';
            _vehiculos.forEach(v => {
                const label = `${v.numero_economico || '—'} · ${v.marca || ''} ${v.modelo || ''} (${v.placas || ''})`;
                sel.innerHTML += `<option value="${v.pk_vehiculo}">${label}</option>`;
            });
        } catch (e) {
            console.error('Error cargando vehículos:', e);
        }
    }

    // ── Info del comodato seleccionado ───────────────
    window.cargarInfoComodato = function () {
        const id    = document.getElementById('fk_comodato')?.value;
        const panel = document.getElementById('infoComodato');
        if (!panel) return;

        if (!id) { panel.classList.add('d-none'); return; }

        const c = _comodatos.find(x => String(x.pk_comodato) === String(id));
        if (!c)  { panel.classList.add('d-none'); return; }

        document.getElementById('infoCultivo').textContent        = c.cultivo  || '—';
        document.getElementById('infoEstadoComodato').textContent = c.estado   || '—';
        panel.classList.remove('d-none');
    };

    // ── Listar traslados ────────────────────────────
    async function listar() {
        const tabla = document.getElementById('trasladoBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/traslado/todos');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listando traslados:', e);
        }
    }

    // ── Render tabla ────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('trasladoBody');
        const footer = document.getElementById('footerInfo');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-truck fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay traslados registrados
                </td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'trasladoBody', filasPorPagina: 10, sufijo: 'tr' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((t, i) => {
            const enTransito = !t.fecha_llegada;
            return `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center" style="font-size:12px;">${badgeTipo(t.tipo)}</td>
                <td class="px-3" style="font-size:13px;">${t.destino || '—'}</td>
                <td class="px-3" style="font-size:12px;">
                    ${t.vehiculo_numero_economico
                        ? `<span class="fw-semibold">${t.vehiculo_numero_economico}</span>
                           <span class="text-muted ms-1">${t.vehiculo_marca || ''} ${t.vehiculo_modelo || ''}</span>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${t.fecha_salida ? t.fecha_salida.substring(0, 10) : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${t.fecha_llegada ? t.fecha_llegada.substring(0, 10) : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${enTransito
                        ? '<span class="badge bg-warning text-dark">En tránsito</span>'
                        : '<span class="badge bg-success">Completado</span>'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalleTraslado(${t.pk_traslado})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    ${enTransito ? `
                    <button class="btn btn-sm me-1 text-white" style="background:#2d7a4f;"
                        title="Registrar llegada"
                        onclick="abrirLlegada(${t.pk_traslado})">
                        <i class="fa-solid fa-circle-check" style="font-size:11px;"></i>
                    </button>` : ''}
                    ${enTransito ? `
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar traslado"
                        onclick="abrirEliminar(${t.pk_traslado}, '${(t.destino || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                    </button>` : ''}
                </td>
            </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'trasladoBody', filasPorPagina: 10, sufijo: 'tr' });
    }

    // ── Filtrado dinámico ───────────────────────────
    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value  || '').toLowerCase();
        const tipo   = (document.getElementById('filtroTipo')?.value   || '');
        const estado = (document.getElementById('filtroEstado')?.value || '');

        renderTabla(_registros.filter(t => {
            const texto = `${t.destino} ${t.vehiculo_numero_economico} ${t.vehiculo_marca} ${t.cultivo}`.toLowerCase();
            const enTransito = !t.fecha_llegada;
            const estadoOk = !estado
                || (estado === 'activo'      &&  enTransito)
                || (estado === 'completado'  && !enTransito);

            return (!q    || texto.includes(q))
                && (!tipo || t.tipo === tipo)
                && estadoOk;
        }));
    };

    // ── Guardar traslado ────────────────────────────
    window.guardarTraslado = async function () {
        const fk_comodato   = document.getElementById('fk_comodato').value;
        const tipo          = document.getElementById('tipo').value;
        const destino       = document.getElementById('destino').value.trim();
        const fk_vehiculo   = document.getElementById('fk_vehiculo').value   || null;
        const km_salida     = document.getElementById('km_salida').value      || null;
        const km_llegada    = document.getElementById('km_llegada').value     || null;
        const fecha_salida  = document.getElementById('fecha_salida').value   || null;
        const fecha_llegada = document.getElementById('fecha_llegada').value  || null;
        const observaciones = document.getElementById('observaciones').value.trim() || null;

        if (!fk_comodato) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona el comodato.' });
            return;
        }
        if (!destino) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El destino es obligatorio.' });
            return;
        }

        try {
            await fetchWithAuth('/traslado', 'POST', {
                fk_comodato, tipo, destino, fk_vehiculo,
                km_salida, km_llegada, fecha_salida, fecha_llegada, observaciones
            });
            Swal.fire({ icon: 'success', title: 'Traslado registrado',
                text: 'El traslado fue registrado exitosamente.',
                timer: 2000, showConfirmButton: false });
            mostrarTabla();
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Ver detalle ─────────────────────────────────
    window.verDetalleTraslado = async function (id) {
        try {
            const t = await fetchWithAuth(`/traslado/${id}`);
            const enTransito = !t.fecha_llegada;

            document.getElementById('modalDetalleBody').innerHTML = `
                <div class="row g-3" style="font-size:13px;">
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TIPO</div>
                            <div>${badgeTipo(t.tipo)}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">ESTADO</div>
                            <div>${enTransito
                                ? '<span class="badge bg-warning text-dark">En tránsito</span>'
                                : '<span class="badge bg-success">Completado</span>'}</div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">DESTINO</div>
                            <div class="fw-semibold">${t.destino || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">CULTIVO (COMODATO)</div>
                            <div>${t.cultivo || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">VEHÍCULO</div>
                            <div>${t.vehiculo_numero_economico
                                ? `${t.vehiculo_numero_economico} · ${t.vehiculo_marca || ''} ${t.vehiculo_modelo || ''} (${t.vehiculo_placas || ''})`
                                : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA SALIDA</div>
                            <div>${t.fecha_salida ? t.fecha_salida.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA LLEGADA</div>
                            <div>${t.fecha_llegada ? t.fecha_llegada.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">KM SALIDA</div>
                            <div>${t.km_salida ?? '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">KM LLEGADA</div>
                            <div>${t.km_llegada ?? '—'}</div>
                        </div>
                    </div>
                    ${t.observaciones ? `
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">OBSERVACIONES</div>
                            <div>${t.observaciones}</div>
                        </div>
                    </div>` : ''}
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</div>
                            <div>${t.registrado_por_usuario || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA REGISTRO</div>
                            <div>${t.fecha_registro ? t.fecha_registro.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                </div>`;
            new bootstrap.Modal(document.getElementById('modalDetalle')).show();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Registrar llegada ───────────────────────────
    window.abrirLlegada = function (id) {
        document.getElementById('llegadaId').value            = id;
        document.getElementById('llegadaFecha').value         = '';
        document.getElementById('llegadaKm').value            = '';
        document.getElementById('llegadaObservaciones').value = '';
        new bootstrap.Modal(document.getElementById('modalLlegada')).show();
    };

    window.confirmarLlegada = async function () {
        const id             = document.getElementById('llegadaId').value;
        const fecha_llegada  = document.getElementById('llegadaFecha').value;
        const km_llegada     = document.getElementById('llegadaKm').value            || null;
        const observaciones  = document.getElementById('llegadaObservaciones').value.trim() || null;

        if (!fecha_llegada) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'La fecha de llegada es obligatoria.' });
            return;
        }

        try {
            await fetchWithAuth(`/traslado/${id}/llegada`, 'PATCH', {
                fecha_llegada, km_llegada, observaciones
            });
            bootstrap.Modal.getInstance(document.getElementById('modalLlegada')).hide();
            Swal.fire({ icon: 'success', title: 'Llegada registrada',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Eliminar traslado ───────────────────────────
    window.abrirEliminar = function (id, destino) {
        _idEliminar = id;
        document.getElementById('eliminarDestino').textContent = destino || 'Sin destino';
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/traslado/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ icon: 'success', title: 'Traslado eliminado',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Helpers de badges ───────────────────────────
    function badgeTipo(tipo) {
        const mapa = {
            entrega:     ['primary', 'Entrega'],
            recoleccion: ['info',    'Recolección'],
        };
        const [color, label] = mapa[tipo] || ['secondary', tipo || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

})();

// ── UI Global ──────────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('pk_traslado').value    = '';
    document.getElementById('fk_comodato').value    = '';
    document.getElementById('tipo').value           = 'entrega';
    document.getElementById('destino').value        = '';
    document.getElementById('fk_vehiculo').value    = '';
    document.getElementById('km_salida').value      = '';
    document.getElementById('km_llegada').value     = '';
    document.getElementById('fecha_salida').value   = '';
    document.getElementById('fecha_llegada').value  = '';
    document.getElementById('observaciones').value  = '';
    document.getElementById('tituloFormulario').textContent = 'Nuevo traslado';
    document.getElementById('infoComodato').classList.add('d-none');

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};