(function () {

    let _registrosActivos       = [];
    let _registrosInhabilitados = [];
    let _idParaInhabilitar      = null;

    esperarElemento('bodBody', async () => {
        listar();
    }, 20, 'inventario/bodega');

    // ─────────────────────────────────────────
    // LISTAR ACTIVAS
    // ─────────────────────────────────────────
    async function listar() {
        const tabla = document.getElementById('bodBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/bodega');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar bodegas:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las bodegas' });
        }
    }

    // ─────────────────────────────────────────
    // RENDER TABLA ACTIVAS
    // ─────────────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('bodBody');
        const footer = document.getElementById('footerInfo');
        const info   = document.getElementById('info-registros-bod');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-house-chimney fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay bodegas registradas
                </td></tr>`;
            if (footer) footer.textContent = '';
            if (info)   info.textContent   = 'Sin registros';
            initPaginacion({ tbodyId: 'bodBody', filasPorPagina: 10, sufijo: 'bod' });
            return;
        }

        if (footer) footer.textContent = '';
        if (info)   info.textContent   = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((b, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${b.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${b.capacidad_kg != null
                        ? parseFloat(b.capacidad_kg).toLocaleString('es-MX') + ' kg'
                        : '—'}
                </td>
                <td class="px-3 text-center">${badgeEstado(b.estado)}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                    ${b.descripcion || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${b.registrado_por_usuario || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${b.fecha_registro
                        ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarBodega(${b.pk_bodega})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Inhabilitar"
                        onclick="abrirInhabilitar(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'bodBody', filasPorPagina: 10, sufijo: 'bod' });
    }

    // ─────────────────────────────────────────
    // BADGE ESTADO
    // ─────────────────────────────────────────
    function badgeEstado(estado) {
        const map = {
            'Operativo':        ['bg-success',           'Operativo'],
            'En mantenimiento': ['bg-warning text-dark',  'En mantenimiento'],
            'Inhabilitada':     ['bg-danger',             'Inhabilitada']
        };
        const [cls, lbl] = map[estado] || ['bg-secondary', estado || '—'];
        return `<span class="badge ${cls}" style="font-size:11px;">${lbl}</span>`;
    }

    // ─────────────────────────────────────────
    // FILTRAR ACTIVAS
    // ─────────────────────────────────────────
    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado = document.getElementById('filtroEstado')?.value || '';
        renderTabla(_registrosActivos.filter(b => {
            const txt = `${b.nombre} ${b.descripcion || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!estado || b.estado === estado);
        }));
    };

    // ─────────────────────────────────────────
    // TABS
    // ─────────────────────────────────────────
    window.switchTab = function (tab) {
        const va = document.getElementById('vistaActivos');
        const vi = document.getElementById('vistaInhabilitadas');
        const ta = document.getElementById('tabActivos');
        const ti = document.getElementById('tabInhabilitadas');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vi.classList.add('d-none');
            ta.classList.add('active');    ti.classList.remove('active');
        } else {
            va.classList.add('d-none');    vi.classList.remove('d-none');
            ta.classList.remove('active'); ti.classList.add('active');
            listarInhabilitadas();
        }
    };

    // ─────────────────────────────────────────
    // LISTAR INHABILITADAS
    // ─────────────────────────────────────────
    async function listarInhabilitadas() {
        const cuerpo = document.getElementById('inhabBody');
        const info   = document.getElementById('info-registros-inhab');
        if (!cuerpo) return;
        cuerpo.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data               = await fetchWithAuth('/bodega/inhabilitadas');
            _registrosInhabilitados  = Array.isArray(data) ? data : [];

            if (!_registrosInhabilitados.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="7" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay bodegas inhabilitadas
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'inhabBody', filasPorPagina: 10, sufijo: 'inhab' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInhabilitados.length} registros`;

            cuerpo.innerHTML = _registrosInhabilitados.map((b, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${b.nombre || '—'}</span>
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${b.capacidad_kg != null
                            ? parseFloat(b.capacidad_kg).toLocaleString('es-MX') + ' kg'
                            : '—'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                        ${b.descripcion || '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${b.registrado_por_usuario || '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;">
                        ${b.fecha_registro
                            ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarBodega(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'inhabBody', filasPorPagina: 10, sufijo: 'inhab' });
        } catch (e) { console.error('Error inhabilitadas:', e); }
    }

    // ─────────────────────────────────────────
    // FILTRAR INHABILITADAS
    // ─────────────────────────────────────────
    window.filtrarInhabilitadas = function () {
        const q    = (document.getElementById('searchInhabilitadas')?.value || '').toLowerCase();
        const info = document.getElementById('info-registros-inhab');
        const filtrados = _registrosInhabilitados.filter(b => {
            const txt = `${b.nombre} ${b.descripcion || ''}`.toLowerCase();
            return !q || txt.includes(q);
        });
        const cuerpo = document.getElementById('inhabBody');
        if (!cuerpo) return;
        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInhabilitados.length} registros`;
        cuerpo.innerHTML = filtrados.map((b, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${b.nombre || '—'}</span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${b.capacidad_kg != null
                        ? parseFloat(b.capacidad_kg).toLocaleString('es-MX') + ' kg'
                        : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                    ${b.descripcion || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${b.registrado_por_usuario || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${b.fecha_registro
                        ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarBodega(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'inhabBody', filasPorPagina: 10, sufijo: 'inhab' });
    };

    // ─────────────────────────────────────────
    // ABRIR FORMULARIO (CREAR) — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.abrirFormulario = function () {
        document.getElementById('f_pk_bodega').value       = '';
        document.getElementById('f_nombre').value          = '';
        document.getElementById('f_capacidad_kg').value    = '';
        document.getElementById('f_estado').value          = 'Operativo';
        document.getElementById('f_descripcion').value     = '';
        document.getElementById('formTitulo').textContent  = 'Registrar Bodega';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar bodega';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ─────────────────────────────────────────
    // EDITAR — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.editarBodega = function (id) {
        const b = _registrosActivos.find(x => x.pk_bodega === id);
        if (!b) return;

        document.getElementById('f_pk_bodega').value       = b.pk_bodega;
        document.getElementById('f_nombre').value          = b.nombre || '';
        document.getElementById('f_capacidad_kg').value    = b.capacidad_kg != null ? b.capacidad_kg : '';
        document.getElementById('f_estado').value          = b.estado || 'Operativo';
        document.getElementById('f_descripcion').value     = b.descripcion || '';
        document.getElementById('formTitulo').textContent  = `Editando: ${b.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ─────────────────────────────────────────
    // CANCELAR FORMULARIO — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_bodega').value    = '';
        document.getElementById('f_nombre').value       = '';
        document.getElementById('f_capacidad_kg').value = '';
        document.getElementById('f_estado').value       = 'Operativo';
        document.getElementById('f_descripcion').value  = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ─────────────────────────────────────────
    // GUARDAR (CREAR O ACTUALIZAR) — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.guardarBodega = async function () {
        const id          = document.getElementById('f_pk_bodega').value;
        const nombre      = document.getElementById('f_nombre').value.trim();
        const capacidad   = document.getElementById('f_capacidad_kg').value;
        const estado      = document.getElementById('f_estado').value;
        const descripcion = document.getElementById('f_descripcion').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        const payload = {
            nombre,
            capacidad_kg: capacidad !== '' ? capacidad : null,
            estado,
            descripcion:  descripcion || null
        };

        try {
            if (id) {
                await fetchWithAuth(`/bodega/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Bodega actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/bodega', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Bodega creada exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ─────────────────────────────────────────
    // INHABILITAR
    // ─────────────────────────────────────────
    window.abrirInhabilitar = function (id, nombre) {
        _idParaInhabilitar = id;
        document.getElementById('inhabilitarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalInhabilitar')).show();
    };

    window.confirmarInhabilitar = async function () {
        try {
            await fetchWithAuth(`/bodega/${_idParaInhabilitar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalInhabilitar')).hide();
            Swal.fire({ icon: 'success', title: 'Inhabilitada',
                text: 'La bodega fue inhabilitada exitosamente',
                timer: 2000, showConfirmButton: false });
            _idParaInhabilitar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ─────────────────────────────────────────
    // REACTIVAR — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.reactivarBodega = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon:              'question',
            title:             'Reactivar bodega',
            text:              `¿Deseas reactivar "${nombre}"?`,
            showCancelButton:   true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText:  'Cancelar',
            confirmButtonColor:'#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/bodega/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivada',
                text: 'Bodega reactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInhabilitadas();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();