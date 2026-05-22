// ============================================
// MÓDULO: mobiliario.js
// ============================================

(function () {

    let _muebles      = [];
    let _mueblesBaja  = [];
    let _prestamos    = [];
    let _movimientos  = [];
    let _disponibles  = [];
    let _ubicaciones  = [];
    let _empleados    = [];
    let _movMuebleId = null;
    let _accionMuebleData = null;

    esperarElemento('muebleBody', async () => {
        await cargarCatalogos();
        await listarMuebles();
    }, 20, 'mobiliario/mobiliario');

    // ════════════════════════════════════════
    // CATÁLOGOS
    // ════════════════════════════════════════
    async function cargarCatalogos() {
        const cargar = async (url) => {
            try { const d = await fetchWithAuth(url); return Array.isArray(d) ? d : []; }
            catch (e) { console.error(`Error ${url}:`, e); return []; }
        };
        _ubicaciones = await cargar('/ubicacion');
        _empleados   = await cargar('/empleados');

        llenarSelect('f_fk_ubicacion',   _ubicaciones, 'pk_ubicacion', 'nombre');
        llenarSelect('f_fk_responsable', _empleados,   'pk_empleado',  e => `${e.nombre} ${e.apellido_paterno}`);
        llenarSelect('fp_fk_responsable', _empleados,  'pk_empleado',  e => `${e.nombre} ${e.apellido_paterno}`);
    }

    // ════════════════════════════════════════
    // LISTAR MUEBLES
    // ════════════════════════════════════════
    async function listarMuebles() {
        const tabla = document.getElementById('muebleBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/mobiliario');
            _muebles = Array.isArray(data) ? data : [];
            renderTarjetasMuebles(_muebles);
            renderTablaMuebles(_muebles);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el inventario' });
        }
    }

    // ════════════════════════════════════════
    // TARJETAS RESUMEN
    // ════════════════════════════════════════
    function renderTarjetasMuebles(data) {
        const cont = document.getElementById('tarjetasMuebles');
        if (!cont) return;
        const total        = data.length;
        const disponibles  = data.filter(m => m.estado_operativo === 'disponible').length;
        const prestados    = data.filter(m => m.estado_operativo === 'prestado').length;
        const mantenimiento = data.filter(m => m.estado_operativo === 'mantenimiento').length;
        cont.innerHTML = `
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Muebles</div>
                <div class="fw-bold" style="font-size:28px;color:#1a3c5e;">${total}</div>
                <div class="text-muted" style="font-size:11px;">Registrados activos</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Disponibles</div>
                <div class="fw-bold" style="font-size:24px;color:#2d7a4f;">${disponibles}</div>
                <div class="text-muted" style="font-size:11px;">listo${disponibles !== 1 ? 's' : ''} para uso</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Prestados</div>
                <div class="fw-bold" style="font-size:24px;color:#2563eb;">${prestados}</div>
                <div class="text-muted" style="font-size:11px;">en préstamo activo</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Mantenimiento</div>
                <div class="fw-bold" style="font-size:24px;color:#e6a817;">${mantenimiento}</div>
                <div class="text-muted" style="font-size:11px;">en reparación</div>
            </div></div></div>`;
    }

    // ════════════════════════════════════════
    // RENDER TABLA MUEBLES
    // ════════════════════════════════════════
    function renderTablaMuebles(data) {
        const tabla = document.getElementById('muebleBody');
        const info  = document.getElementById('info-registros-mob');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">
                <i class="fa-solid fa-chair fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay muebles registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'muebleBody', filasPorPagina: 10, sufijo: 'mob' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_muebles.length} registros`;

        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 fw-semibold" style="font-size:12px;color:#1a3c5e;">${m.numero_economico}</td>
                <td class="px-3 fw-semibold" style="font-size:13px;">${m.nombre}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.marca || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.ubicacion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.responsable || '—'}</td>
                <td class="px-3 text-center">${badgeEstadoFisico(m.estado_fisico)}</td>
                <td class="px-3 text-center">${badgeEstadoOp(m.estado_operativo)}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarMueble(${m.pk_mobiliario})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info me-1" title="Historial"
                        onclick="verHistorialMueble(${m.pk_mobiliario}, '${(m.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size:11px;"></i>
                    </button>
                    ${m.estado_operativo === 'disponible' ? `
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Movimiento"
                        onclick="abrirModalMovimiento(${m.pk_mobiliario}, '${(m.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-arrows-rotate" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" title="Enviar a mantenimiento"
                        onclick="accionMueble(${m.pk_mobiliario}, 'mantenimiento', '${(m.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-screwdriver-wrench" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="accionMueble(${m.pk_mobiliario}, 'baja', '${(m.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>` : ''}
                    ${m.estado_operativo === 'mantenimiento' ? `
                    <button class="btn btn-sm btn-outline-success" title="Marcar disponible"
                        onclick="accionMueble(${m.pk_mobiliario}, 'disponible', '${(m.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-check" style="font-size:11px;"></i>
                    </button>` : ''}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'muebleBody', filasPorPagina: 10, sufijo: 'mob' });
    }

    // ════════════════════════════════════════
    // FILTRAR MUEBLES
    // ════════════════════════════════════════
    window.filtrarMuebles = function () {
        const q       = (document.getElementById('searchMueble')?.value || '').toLowerCase();
        const estadoOp  = document.getElementById('filtroEstadoOp')?.value || '';
        const estadoFis = document.getElementById('filtroEstadoFis')?.value || '';
        renderTablaMuebles(_muebles.filter(m => {
            const txt = `${m.nombre} ${m.numero_economico} ${m.marca || ''} ${m.responsable || ''}`.toLowerCase();
            return (!q || txt.includes(q))
                && (!estadoOp  || m.estado_operativo === estadoOp)
                && (!estadoFis || m.estado_fisico    === estadoFis);
        }));
    };



window.abrirModalMovimiento = async function (id, nombre) {
    const m = await fetchWithAuth(`/mobiliario/${id}`);
    _movMuebleId = id;

    // Llenar tarjeta
    document.getElementById('movNombre').textContent  = nombre;
    document.getElementById('movDetalle').textContent =
        `${m.numero_economico || ''}${m.marca ? ' · ' + m.marca : ''}${m.modelo ? ' ' + m.modelo : ''}`;

    // Reset campos
    document.getElementById('movTipoInput').value       = '';
    document.getElementById('movResponsableInput').value = '';
    document.getElementById('movUbicacionInput').value   = '';
    document.getElementById('movMotivoInput').value      = '';
    document.getElementById('movCampoResponsable').classList.add('d-none');
    document.getElementById('movCampoUbicacion').classList.add('d-none');
    document.getElementById('err_mov_tipo').classList.add('d-none');

    // Llenar selects
    const selResp = document.getElementById('movResponsableInput');
    selResp.innerHTML = '<option value="">— Sin cambio —</option>' +
        _empleados.map(e =>
            `<option value="${e.pk_empleado}" ${e.pk_empleado == m.fk_responsable ? 'selected' : ''}>
                ${e.nombre} ${e.apellido_paterno}
            </option>`).join('');

    const selUbic = document.getElementById('movUbicacionInput');
    selUbic.innerHTML = '<option value="">— Sin cambio —</option>' +
        _ubicaciones.map(u =>
            `<option value="${u.pk_ubicacion}" ${u.pk_ubicacion == m.fk_ubicacion ? 'selected' : ''}>
                ${u.nombre}
            </option>`).join('');

    new bootstrap.Modal(document.getElementById('modalMovimiento')).show();
};

window.actualizarCamposMovimiento = function () {
    const tipo = document.getElementById('movTipoInput').value;
    const necesitaResponsable = ['asignacion', 'reasignacion'].includes(tipo);
    const necesitaUbicacion   = ['asignacion', 'traslado'].includes(tipo);

    document.getElementById('movCampoResponsable').classList.toggle('d-none', !necesitaResponsable);
    document.getElementById('movCampoUbicacion').classList.toggle('d-none', !necesitaUbicacion);

    if (tipo === 'reasignacion') {
        document.getElementById('movLabelResponsable').textContent = 'Nuevo Responsable';
    } else {
        document.getElementById('movLabelResponsable').textContent = 'Responsable';
    }
};

window.confirmarMovimiento = async function () {
    const tipo = document.getElementById('movTipoInput').value;
    if (!tipo) {
        document.getElementById('err_mov_tipo').classList.remove('d-none');
        return;
    }
    document.getElementById('err_mov_tipo').classList.add('d-none');

    const payload = {
        fk_mobiliario:        _movMuebleId,
        tipo_movimiento:      tipo,
        fk_responsable_nuevo: parseInt(document.getElementById('movResponsableInput').value) || null,
        fk_ubicacion_nueva:   parseInt(document.getElementById('movUbicacionInput').value)   || null,
        motivo:               document.getElementById('movMotivoInput').value.trim() || null
    };

    try {
        await fetchWithAuth('/movimientos-mobiliario/registrar', 'POST', payload);
        bootstrap.Modal.getInstance(document.getElementById('modalMovimiento')).hide();
        Swal.fire({ icon: 'success', title: 'Listo', text: 'Movimiento registrado', timer: 2000, showConfirmButton: false });
        await listarMuebles();
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
    }
};
    // ════════════════════════════════════════
    // FORMULARIO MUEBLE
    // ════════════════════════════════════════
    function resetFormulario() {
        ['f_pk_mobiliario','f_numero_economico','f_nombre','f_marca','f_modelo','f_numero_serie','f_descripcion']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('f_fk_ubicacion').value   = '';
        document.getElementById('f_fk_responsable').value = '';
        document.getElementById('f_estado_fisico').value  = 'bueno';
        ['err_numero_economico','err_nombre','err_ubicacion']
            .forEach(id => document.getElementById(id)?.classList.add('d-none'));
        document.getElementById('formTituloMueble').textContent = 'Nuevo Mueble';
        document.getElementById('btnGuardarLabel').textContent  = 'Guardar mueble';
    }

    window.abrirFormularioMueble = function () {
        resetFormulario();
        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_numero_economico').focus();
    };

    window.editarMueble = async function (id) {
        try {
            const m = await fetchWithAuth(`/mobiliario/${id}`);
            document.getElementById('f_pk_mobiliario').value     = m.pk_mobiliario;
            document.getElementById('f_numero_economico').value  = m.numero_economico;
            document.getElementById('f_nombre').value            = m.nombre;
            document.getElementById('f_marca').value             = m.marca  || '';
            document.getElementById('f_modelo').value            = m.modelo || '';
            document.getElementById('f_numero_serie').value      = m.numero_serie || '';
            document.getElementById('f_estado_fisico').value     = m.estado_fisico;
            document.getElementById('f_fk_ubicacion').value      = m.fk_ubicacion  || '';
            document.getElementById('f_fk_responsable').value    = m.fk_responsable || '';
            document.getElementById('f_descripcion').value       = m.descripcion || '';
            document.getElementById('formTituloMueble').textContent = `Editando: ${m.nombre}`;
            document.getElementById('btnGuardarLabel').textContent  = 'Guardar cambios';
            document.getElementById('vistaTabla').classList.add('d-none');
            document.getElementById('vistaFormulario').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    window.cancelarFormulario = function () {
        resetFormulario();
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
    };

    window.guardarMueble = async function () {
        const id              = document.getElementById('f_pk_mobiliario').value;
        const numero_economico = document.getElementById('f_numero_economico').value.trim();
        const nombre          = document.getElementById('f_nombre').value.trim();
        const fk_ubicacion    = document.getElementById('f_fk_ubicacion').value;

        let valido = true;
        if (!numero_economico) { document.getElementById('err_numero_economico').classList.remove('d-none'); valido = false; }
        else                     document.getElementById('err_numero_economico').classList.add('d-none');
        if (!nombre)           { document.getElementById('err_nombre').classList.remove('d-none'); valido = false; }
        else                     document.getElementById('err_nombre').classList.add('d-none');
        if (!fk_ubicacion)     { document.getElementById('err_ubicacion').classList.remove('d-none'); valido = false; }
        else                     document.getElementById('err_ubicacion').classList.add('d-none');
        if (!valido) return;

        const payload = {
            numero_economico,
            nombre,
            fk_ubicacion:    parseInt(fk_ubicacion),
            marca:           document.getElementById('f_marca').value.trim()        || null,
            modelo:          document.getElementById('f_modelo').value.trim()       || null,
            numero_serie:    document.getElementById('f_numero_serie').value.trim() || null,
            estado_fisico:   document.getElementById('f_estado_fisico').value,
            fk_responsable:  parseInt(document.getElementById('f_fk_responsable').value) || null,
            descripcion:     document.getElementById('f_descripcion').value.trim()  || null
        };

        try {
            if (id) {
                await fetchWithAuth(`/mobiliario/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Mueble actualizado exitosamente', timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/mobiliario', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado', text: 'Mueble registrado exitosamente', timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            await listarMuebles();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ════════════════════════════════════════
    // ACCIONES RÁPIDAS (baja / mantenimiento / disponible)
    // ═══════════════════════════════════════
window.accionMueble = function (id, accion, nombre) {
    const configs = {
        baja: {
            titulo:    '<i class="fa-solid fa-ban me-2"></i>Dar de Baja',
            subtitulo: 'Este mueble quedará dado de baja',
            texto:     'Esta acción no se puede deshacer.',
            color:     '#b2382d',
            cardBg:    '#fbe9e7',
            cardBorder:'rgba(178,56,45,.25)',
            icon:      'fa-ban',
            iconColor: '#b2382d',
            btnColor:  '#b2382d',
            btnLabel:  '<i class="fa-solid fa-ban me-1"></i>Confirmar Baja',
            url:       `/mobiliario/${id}/baja`,
            method:    'PATCH',
            msg:       'Dado de baja exitosamente'
        },
        mantenimiento: {
            titulo:    '<i class="fa-solid fa-screwdriver-wrench me-2"></i>Enviar a Mantenimiento',
            subtitulo: 'Este mueble pasará a estado de mantenimiento',
            texto:     'Podrás regresarlo a disponible una vez concluido el mantenimiento.',
            color:     '#e6a817',
            cardBg:    '#fff8e1',
            cardBorder:'rgba(230,168,23,.25)',
            icon:      'fa-screwdriver-wrench',
            iconColor: '#e6a817',
            btnColor:  '#e6a817',
            btnLabel:  '<i class="fa-solid fa-screwdriver-wrench me-1"></i>Confirmar',
            url:       `/mobiliario/${id}/mantenimiento`,
            method:    'PATCH',
            msg:       'Enviado a mantenimiento'
        },
        disponible: {
            titulo:    '<i class="fa-solid fa-check me-2"></i>Marcar Disponible',
            subtitulo: 'Este mueble volverá a estar disponible',
            texto:     'El mueble quedará listo para asignación o préstamo.',
            color:     '#2d7a4f',
            cardBg:    '#e8f5ee',
            cardBorder:'rgba(45,122,79,.25)',
            icon:      'fa-check-circle',
            iconColor: '#2d7a4f',
            btnColor:  '#2d7a4f',
            btnLabel:  '<i class="fa-solid fa-check me-1"></i>Confirmar',
            url:       `/mobiliario/${id}/disponible`,
            method:    'PATCH',
            msg:       'Mueble disponible nuevamente'
        }
    };

    const c = configs[accion];
    _accionMuebleData = { url: c.url, method: c.method, msg: c.msg };

    // Header
    const header = document.getElementById('accionMuebleHeader');
    header.style.background = c.color;
    document.getElementById('accionMuebleTitulo').innerHTML = c.titulo;

    // Tarjeta
    const card = document.getElementById('accionMuebleCard');
    card.style.background   = c.cardBg;
    card.style.border       = `1px solid ${c.cardBorder}`;
    const icon = document.getElementById('accionMuebleIcon');
    icon.className = `fa-solid ${c.icon} fa-2x`;
    icon.style.color = c.iconColor;

    document.getElementById('accionMuebleNombre').textContent    = nombre;
    document.getElementById('accionMuebleSubtitulo').textContent = c.subtitulo;
    document.getElementById('accionMuebleTexto').innerHTML       = c.texto;

    // Botón
    const btn = document.getElementById('accionMuebleBtn');
    btn.style.background = c.color;
    btn.innerHTML        = c.btnLabel;

    new bootstrap.Modal(document.getElementById('modalAccionMueble')).show();
};

window.confirmarAccionMueble = async function () {
    bootstrap.Modal.getInstance(document.getElementById('modalAccionMueble')).hide();
    try {
        await fetchWithAuth(_accionMuebleData.url, _accionMuebleData.method);
        Swal.fire({ icon: 'success', title: 'Listo', text: _accionMuebleData.msg,
            timer: 2000, showConfirmButton: false });
        await listarMuebles();
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
    }
};

    // ════════════════════════════════════════
    // PRÉSTAMOS
    // ════════════════════════════════════════
    async function listarPrestamos() {
        const tabla = document.getElementById('prestamoBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/prestamo-mobiliario');
            _prestamos = Array.isArray(data) ? data : [];
            renderTarjetasPrestamos(_prestamos);
            renderTablaPrestamos(_prestamos);
        } catch (e) { console.error('Error prestamos:', e); }
    }

    function renderTarjetasPrestamos(data) {
        const cont = document.getElementById('tarjetasPrestamos');
        if (!cont) return;
        const total      = data.length;
        const activos    = data.filter(p => p.estado === 'activo').length;
        const finalizados = data.filter(p => p.estado === 'finalizado').length;
        const cancelados  = data.filter(p => p.estado === 'cancelado').length;
        cont.innerHTML = `
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Préstamos</div>
                <div class="fw-bold" style="font-size:28px;color:#1a3c5e;">${total}</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Activos</div>
                <div class="fw-bold" style="font-size:24px;color:#2563eb;">${activos}</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Finalizados</div>
                <div class="fw-bold" style="font-size:24px;color:#2d7a4f;">${finalizados}</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Cancelados</div>
                <div class="fw-bold" style="font-size:24px;color:#c0392b;">${cancelados}</div>
            </div></div></div>`;
    }

    function renderTablaPrestamos(data) {
        const tabla = document.getElementById('prestamoBody');
        const info  = document.getElementById('info-registros-pres');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">
                <i class="fa-solid fa-handshake fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay préstamos registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'prestamoBody', filasPorPagina: 10, sufijo: 'pres' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_prestamos.length} registros`;

        tabla.innerHTML = data.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-muted text-center" style="font-size:12px;">
                    ${p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-muted text-center" style="font-size:12px;">
                    ${p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 fw-semibold" style="font-size:13px;color:#1a3c5e;">${p.responsable || '—'}</td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;">${p.total_muebles}</td>
                <td class="px-3 text-muted" style="font-size:13px;max-width:180px;">${p.motivo || '—'}</td>
                <td class="px-3 text-center">${badgeEstadoPresta(p.estado)}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-info me-1" title="Ver muebles"
                        onclick="verDetallePrestamo(${p.pk_prestamo})">
                        <i class="fa-solid fa-list" style="font-size:11px;"></i>
                    </button>
                    ${p.estado === 'activo' ? `
                    <button class="btn btn-sm btn-outline-success me-1" title="Finalizar"
                        onclick="cambiarEstadoPrestamo(${p.pk_prestamo}, 'finalizar')">
                        <i class="fa-solid fa-check" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Cancelar"
                        onclick="cambiarEstadoPrestamo(${p.pk_prestamo}, 'cancelar')">
                        <i class="fa-solid fa-xmark" style="font-size:11px;"></i>
                    </button>` : ''}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'prestamoBody', filasPorPagina: 10, sufijo: 'pres' });
    }

    window.filtrarPrestamos = function () {
        const q      = (document.getElementById('searchPrestamo')?.value || '').toLowerCase();
        const estado = document.getElementById('filtroEstadoPresta')?.value || '';
        renderTablaPrestamos(_prestamos.filter(p => {
            const txt = `${p.responsable || ''} ${p.motivo || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!estado || p.estado === estado);
        }));
    };

    // FORMULARIO PRÉSTAMO
    async function cargarMueblesDisponibles() {
        const tbody = document.getElementById('listaMueblesDisponibles');
        if (!tbody) return;
        try {
            const data = await fetchWithAuth('/mobiliario/disponibles');
            _disponibles = Array.isArray(data) ? data : [];
            if (!_disponibles.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No hay muebles disponibles</td></tr>`;
                return;
            }
            tbody.innerHTML = _disponibles.map(m => `
                <tr>
                    <td class="px-3 py-2 text-center">
                        <input type="checkbox" class="check-mueble" value="${m.pk_mobiliario}"
                            onchange="actualizarContador()">
                    </td>
                    <td class="px-3 py-2" style="font-size:12px;font-weight:500;color:#1a3c5e;">${m.numero_economico}</td>
                    <td class="px-3 py-2" style="font-size:13px;">${m.nombre}</td>
                    <td class="px-3 py-2 text-muted" style="font-size:12px;">${m.ubicacion || '—'}</td>
                    <td class="px-3 py-2 text-center">${badgeEstadoFisico(m.estado_fisico)}</td>
                </tr>`).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">Error al cargar</td></tr>`;
        }
    }

    window.actualizarContador = function () {
        const checked = document.querySelectorAll('.check-mueble:checked').length;
        const cont = document.getElementById('contadorSeleccionados');
        if (cont) cont.textContent = checked;
        const checkTodos = document.getElementById('checkTodosMuebles');
        if (checkTodos) checkTodos.checked = checked === _disponibles.length && _disponibles.length > 0;
    };

    window.toggleTodosMuebles = function (checkbox) {
        document.querySelectorAll('.check-mueble').forEach(cb => { cb.checked = checkbox.checked; });
        actualizarContador();
    };

    window.abrirFormularioPrestamo = async function () {
        document.getElementById('fp_fk_responsable').value = '';
        document.getElementById('fp_fecha_inicio').value   = '';
        document.getElementById('fp_fecha_fin').value      = '';
        document.getElementById('fp_motivo').value         = '';
        document.getElementById('contadorSeleccionados').textContent = '0';
        document.getElementById('checkTodosMuebles').checked = false;
        ['err_fecha_inicio','err_mobiliarios'].forEach(id => document.getElementById(id)?.classList.add('d-none'));

        document.getElementById('vistaTablaPresta').classList.add('d-none');
        document.getElementById('vistaFormularioPrestamo').classList.remove('d-none');
        await cargarMueblesDisponibles();
    };

    window.cancelarFormularioPrestamo = function () {
        document.getElementById('vistaFormularioPrestamo').classList.add('d-none');
        document.getElementById('vistaTablaPresta').classList.remove('d-none');
    };

    window.guardarPrestamo = async function () {
        const fecha_inicio = document.getElementById('fp_fecha_inicio').value;
        const mobiliarios  = [...document.querySelectorAll('.check-mueble:checked')].map(cb => parseInt(cb.value));

        let valido = true;
        if (!fecha_inicio)    { document.getElementById('err_fecha_inicio').classList.remove('d-none');  valido = false; }
        else                    document.getElementById('err_fecha_inicio').classList.add('d-none');
        if (!mobiliarios.length) { document.getElementById('err_mobiliarios').classList.remove('d-none'); valido = false; }
        else                      document.getElementById('err_mobiliarios').classList.add('d-none');
        if (!valido) return;

        const payload = {
            fk_responsable: parseInt(document.getElementById('fp_fk_responsable').value) || null,
            fecha_inicio,
            fecha_fin:      document.getElementById('fp_fecha_fin').value || null,
            motivo:         document.getElementById('fp_motivo').value.trim() || null,
            mobiliarios
        };

        try {
            await fetchWithAuth('/prestamo-mobiliario', 'POST', payload);
            Swal.fire({ icon: 'success', title: 'Registrado', text: 'Préstamo creado exitosamente', timer: 2000, showConfirmButton: false });
            cancelarFormularioPrestamo();
            await listarPrestamos();
            await listarMuebles();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    window.cambiarEstadoPrestamo = async function (id, accion) {
        const labels = { finalizar: 'finalizar', cancelar: 'cancelar' };
        const confirm = await Swal.fire({
            icon: 'question', title: '¿Confirmar?',
            text: `¿Deseas ${labels[accion]} este préstamo?`,
            showCancelButton: true, confirmButtonText: 'Sí',
            cancelButtonText: 'No', confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/prestamo-mobiliario/${id}/${accion}`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Listo', timer: 1500, showConfirmButton: false });
            await listarPrestamos();
            await listarMuebles();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    window.verDetallePrestamo = async function (id) {
        await Swal.fire({
            title: `<span style="font-size:16px;color:#1a3c5e;">Detalle del préstamo</span>`,
            html: `<div id="swal-detalle-body" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</div>`,
            width: 700, showConfirmButton: false, showCloseButton: true,
            didOpen: async () => {
                try {
                    const data = await fetchWithAuth(`/prestamo-mobiliario/${id}/detalle`);
                    const items = Array.isArray(data) ? data : [];
                    const cont = document.getElementById('swal-detalle-body');
                    if (!cont) return;
                    if (!items.length) {
                        cont.innerHTML = `<div class="text-muted py-3">Sin muebles en este préstamo</div>`;
                        return;
                    }
                    cont.innerHTML = `
                        <div class="table-responsive" style="max-height:400px;overflow-y:auto;">
                            <table class="table table-sm table-hover align-middle mb-0" style="font-size:12px;">
                                <thead style="position:sticky;top:0;background:#1a3c5e;color:#fff;z-index:1;">
                                    <tr>
                                        <th class="px-3 py-2">NO. ECONÓMICO</th>
                                        <th class="px-3 py-2">NOMBRE</th>
                                        <th class="px-3 py-2">UBICACIÓN</th>
                                        <th class="px-3 py-2 text-center">ESTADO FÍS.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(d => `<tr>
                                        <td class="px-3 fw-semibold" style="color:#1a3c5e;">${d.numero_economico}</td>
                                        <td class="px-3">${d.mueble}</td>
                                        <td class="px-3 text-muted">${d.ubicacion || '—'}</td>
                                        <td class="px-3 text-center">${badgeEstadoFisico(d.estado_fisico)}</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="text-muted text-end mt-2" style="font-size:11px;">${items.length} mueble(s)</div>`;
                } catch (e) {
                    const cont = document.getElementById('swal-detalle-body');
                    if (cont) cont.innerHTML = `<div class="text-danger py-3">Error al cargar el detalle</div>`;
                }
            }
        });
    };

    // ════════════════════════════════════════
    // HISTORIAL DE MOVIMIENTOS
    // ════════════════════════════════════════
    async function listarMovimientos() {
        const tabla = document.getElementById('movBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/movimientos-mobiliario');
            _movimientos = Array.isArray(data) ? data : [];
            renderTablaMovimientos(_movimientos);
        } catch (e) { console.error('Error movimientos:', e); }
    }

    function renderTablaMovimientos(data) {
        const tabla = document.getElementById('movBody');
        const info  = document.getElementById('info-registros-mov');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">
                <i class="fa-solid fa-clock-rotate-left fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin movimientos registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_movimientos.length} registros`;

        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-muted text-center" style="font-size:12px;">
                    ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-center">${badgeTipoMov(m.tipo_movimiento)}</td>
                <td class="px-3 fw-semibold" style="font-size:13px;color:#1a3c5e;">${m.mueble || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${m.responsable_anterior || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${m.responsable_nuevo || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${m.ubicacion_anterior || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${m.ubicacion_nueva || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:160px;">${m.motivo || '—'}</td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
    }

    window.filtrarMovimientos = function () {
        const q    = (document.getElementById('searchMov')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipoMov')?.value || '';
        renderTablaMovimientos(_movimientos.filter(m => {
            const txt = `${m.mueble || ''} ${m.motivo || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || m.tipo_movimiento === tipo);
        }));
    };

    // ════════════════════════════════════════
    // HISTORIAL DE UN MUEBLE (SWAL)
    // ════════════════════════════════════════
    window.verHistorialMueble = async function (id, nombre) {
        await Swal.fire({
            title: `<span style="font-size:16px;color:#1a3c5e;">Historial — ${nombre}</span>`,
            html: `<div id="swal-historial-body" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</div>`,
            width: 800, showConfirmButton: false, showCloseButton: true,
            didOpen: async () => {
                try {
                    const data = await fetchWithAuth(`/movimientos-mobiliario/mueble/${id}`);
                    const movs = Array.isArray(data) ? data : [];
                    const cont = document.getElementById('swal-historial-body');
                    if (!cont) return;
                    if (!movs.length) {
                        cont.innerHTML = `<div class="text-muted py-3">
                            <i class="fa-solid fa-inbox fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                            Sin movimientos registrados</div>`;
                        return;
                    }
                    cont.innerHTML = `
                        <div class="table-responsive" style="max-height:400px;overflow-y:auto;">
                            <table class="table table-sm table-hover align-middle mb-0" style="font-size:12px;">
                                <thead style="position:sticky;top:0;background:#1a3c5e;color:#fff;z-index:1;">
                                    <tr>
                                        <th class="px-2 py-2">FECHA</th>
                                        <th class="px-2 py-2 text-center">TIPO</th>
                                        <th class="px-2 py-2">RESP. ANTERIOR</th>
                                        <th class="px-2 py-2">RESP. NUEVO</th>
                                        <th class="px-2 py-2">UBIC. ANT.</th>
                                        <th class="px-2 py-2">UBIC. NUEVA</th>
                                        <th class="px-2 py-2">MOTIVO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${movs.map(m => `<tr>
                                        <td class="px-2 text-muted">
                                            ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '—'}
                                        </td>
                                        <td class="px-2 text-center">${badgeTipoMov(m.tipo_movimiento)}</td>
                                        <td class="px-2 text-muted">${m.responsable_anterior || '—'}</td>
                                        <td class="px-2 text-muted">${m.responsable_nuevo || '—'}</td>
                                        <td class="px-2 text-muted">${m.ubicacion_anterior || '—'}</td>
                                        <td class="px-2 text-muted">${m.ubicacion_nueva || '—'}</td>
                                        <td class="px-2 text-muted">${m.motivo || '—'}</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="text-muted text-end mt-2" style="font-size:11px;">${movs.length} movimiento(s)</div>`;
                } catch (e) {
                    const cont = document.getElementById('swal-historial-body');
                    if (cont) cont.innerHTML = `<div class="text-danger py-3">Error al cargar el historial</div>`;
                }
            }
        });
    };

    // ════════════════════════════════════════
    // BAJAS
    // ════════════════════════════════════════
    async function listarBajas() {
        const tabla = document.getElementById('bajaBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/mobiliario/bajas');
            _mueblesBaja = Array.isArray(data) ? data : [];
            renderTablaBajas(_mueblesBaja);
        } catch (e) { console.error('Error bajas:', e); }
    }

    function renderTablaBajas(data) {
        const tabla = document.getElementById('bajaBody');
        const info  = document.getElementById('info-registros-baja');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay muebles dados de baja</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'bajaBody', filasPorPagina: 10, sufijo: 'baja' });
            return;
        }

        if (info) info.textContent = `${data.length} registros`;

        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 fw-semibold" style="font-size:12px;color:#1a3c5e;">${m.numero_economico}</td>
                <td class="px-3 fw-semibold" style="font-size:13px;">${m.nombre}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.marca || '—'}</td>
                <td class="px-3 text-center">${badgeEstadoFisico(m.estado_fisico)}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.ubicacion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.responsable || '—'}</td>
                <td class="px-3 text-muted text-center" style="font-size:12px;">
                    ${m.fecha_registro ? new Date(m.fecha_registro).toLocaleDateString('es-MX') : '—'}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'bajaBody', filasPorPagina: 10, sufijo: 'baja' });
    }

    window.filtrarBajas = function () {
        const q = (document.getElementById('searchBaja')?.value || '').toLowerCase();
        renderTablaBajas(_mueblesBaja.filter(m =>
            !q || `${m.nombre} ${m.numero_economico} ${m.marca || ''}`.toLowerCase().includes(q)
        ));
    };

    // ════════════════════════════════════════
    // SWITCH TABS
    // ════════════════════════════════════════
    window.switchTab = function (tab) {
        const tabs   = ['muebles', 'prestamos', 'movimientos', 'bajas'];
        const vistas = { muebles: 'vistaMueblesTab', prestamos: 'vistaPrestamosTab', movimientos: 'vistaMovimientosTab', bajas: 'vistaBajasTab' };
        const tabEls = { muebles: 'tabMuebles',      prestamos: 'tabPrestamos',      movimientos: 'tabMovimientos',      bajas: 'tabBajas' };

        tabs.forEach(t => {
            document.getElementById(vistas[t])?.classList.toggle('d-none', t !== tab);
            document.getElementById(tabEls[t])?.classList.toggle('active', t === tab);
        });

        const btnNuevo = document.getElementById('btnNuevoMueble');
        if (btnNuevo) btnNuevo.classList.toggle('d-none', tab !== 'muebles');

        // Cerrar formularios al cambiar tab
        document.getElementById('vistaFormulario')?.classList.add('d-none');
        document.getElementById('vistaTabla')?.classList.remove('d-none');
        document.getElementById('vistaFormularioPrestamo')?.classList.add('d-none');
        document.getElementById('vistaTablaPresta')?.classList.remove('d-none');

        if (tab === 'prestamos')   listarPrestamos();
        if (tab === 'movimientos') listarMovimientos();
        if (tab === 'bajas')       listarBajas();
    };

    // ════════════════════════════════════════
    // UTILIDADES
    // ════════════════════════════════════════
    function llenarSelect(selectId, datos, valueKey, labelKey) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const primera = select.options[0]?.value === '' ? select.options[0].outerHTML : '';
        select.innerHTML = primera +
            (Array.isArray(datos) ? datos : []).map(d => {
                const label = typeof labelKey === 'function' ? labelKey(d) : d[labelKey];
                return `<option value="${d[valueKey]}">${label}</option>`;
            }).join('');
    }

    function badgeEstadoOp(estado) {
        const map = {
            disponible:    `<span class="badge" style="background:#2d7a4f;font-size:11px;">Disponible</span>`,
            prestado:      `<span class="badge bg-primary"         style="font-size:11px;">Prestado</span>`,
            mantenimiento: `<span class="badge bg-warning text-dark" style="font-size:11px;">Mantenimiento</span>`,
            baja:          `<span class="badge bg-danger"           style="font-size:11px;">Baja</span>`
        };
        return map[estado] || `<span class="badge bg-secondary" style="font-size:11px;">${estado}</span>`;
    }

    function badgeEstadoFisico(estado) {
        const map = {
            bueno:   `<span class="badge" style="background:#2d7a4f;font-size:11px;">Bueno</span>`,
            regular: `<span class="badge bg-warning text-dark" style="font-size:11px;">Regular</span>`,
            malo:    `<span class="badge bg-danger"            style="font-size:11px;">Malo</span>`
        };
        return map[estado] || `<span class="badge bg-secondary" style="font-size:11px;">${estado || '—'}</span>`;
    }

    function badgeEstadoPresta(estado) {
        const map = {
            activo:     `<span class="badge bg-primary"           style="font-size:11px;">Activo</span>`,
            finalizado: `<span class="badge" style="background:#2d7a4f;font-size:11px;">Finalizado</span>`,
            cancelado:  `<span class="badge bg-danger"            style="font-size:11px;">Cancelado</span>`
        };
        return map[estado] || `<span class="badge bg-secondary" style="font-size:11px;">${estado}</span>`;
    }

    function badgeTipoMov(tipo) {
        const map = {
            alta:         `<span class="badge" style="background:#2d7a4f;font-size:11px;">Alta</span>`,
            asignacion:   `<span class="badge bg-primary"           style="font-size:11px;">Asignación</span>`,
            reasignacion: `<span class="badge bg-info text-dark"    style="font-size:11px;">Reasignación</span>`,
            traslado:     `<span class="badge bg-warning text-dark" style="font-size:11px;">Traslado</span>`,
            baja:         `<span class="badge bg-danger"            style="font-size:11px;">Baja</span>`
        };
        return map[tipo] || `<span class="badge bg-secondary" style="font-size:11px;">${tipo}</span>`;
    }

})();