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
                <tr><td colspan="7" class="text-center py-5 text-muted">
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
                    ${b.capacidad_ton != null
                        ? parseFloat(b.capacidad_ton).toLocaleString('es-MX') + ' ton'
                        : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                    ${b.descripcion || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                    ${b.registrado_por_usuario || '—'} •<br>
                    ${b.fecha_registro
                        ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarBodega(${b.pk_bodega})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" title="Mantenimiento"
                        onclick="abrirMantenimiento(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-wrench" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'bodBody', filasPorPagina: 10, sufijo: 'bod' });
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
   // Cambiar switchTab
    window.switchTab = function (tab) {
        const va = document.getElementById('vistaActivos');
        const vm = document.getElementById('vistaMantenimiento');
        const ta = document.getElementById('tabActivos');
        const tm = document.getElementById('tabMantenimiento');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vm.classList.add('d-none');
            ta.classList.add('active');    tm.classList.remove('active');
        } else {
            va.classList.add('d-none');    vm.classList.remove('d-none');
            ta.classList.remove('active'); tm.classList.add('active');
            listarMantenimiento();
        }
    };

    // Renombrar abrirInhabilitar → abrirMantenimiento
    window.abrirMantenimiento = function (id, nombre) {
        _idParaInhabilitar = id;
        document.getElementById('mantenimientoNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalMantenimiento')).show();
    };

    window.confirmarMantenimiento = async function () {
        try {
            await fetchWithAuth(`/bodega/${_idParaInhabilitar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalMantenimiento')).hide();
            Swal.fire({ icon: 'success', title: 'En Mantenimiento',
                text: 'La bodega fue enviada a mantenimiento',
                timer: 2000, showConfirmButton: false });
            _idParaInhabilitar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ─────────────────────────────────────────
    // LISTAR INHABILITADAS
    // ─────────────────────────────────────────
    async function listarMantenimiento() {
        const cuerpo = document.getElementById('inhabBody');
        const info   = document.getElementById('info-registros-inhab');
        if (!cuerpo) return;
        cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data = await fetchWithAuth('/bodega/mantenimiento');
            _registrosInhabilitados  = Array.isArray(data) ? data : [];

            if (!_registrosInhabilitados.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="6" class="text-center py-5 text-muted">
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
                        ${b.capacidad_ton != null
                        ? parseFloat(b.capacidad_ton).toLocaleString('es-MX') + ' ton'
                        : '—'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                        ${b.descripcion || '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                        ${b.registrado_por_usuario || '—'} •<br>
                        ${b.fecha_registro
                            ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarBodega(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
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
                   ${b.capacidad_ton != null
                        ? parseFloat(b.capacidad_ton).toLocaleString('es-MX') + ' ton'
                        : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                    ${b.descripcion || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                    ${b.registrado_por_usuario || '—'} •<br>
                    ${b.fecha_registro
                        ? new Date(b.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarBodega(${b.pk_bodega}, '${(b.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
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
        document.getElementById('f_capacidad_ton').value = '';
        document.getElementById('f_descripcion').value     = '';
        document.getElementById('formTitulo').textContent  = 'Registrar Bodega';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar bodega';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
        document.getElementById('err_capacidad').classList.add('d-none');
        document.getElementById('err_nombre').textContent = 'Campo requerido';
    };

    // ─────────────────────────────────────────
    // EDITAR — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.editarBodega = function (id) {
        const b = _registrosActivos.find(x => x.pk_bodega === id);
        if (!b) return;

        document.getElementById('f_pk_bodega').value       = b.pk_bodega;
        document.getElementById('f_nombre').value          = b.nombre || '';
        document.getElementById('f_capacidad_ton').value = b.capacidad_ton != null ? b.capacidad_ton : '';
        document.getElementById('f_descripcion').value     = b.descripcion || '';
        document.getElementById('formTitulo').textContent  = `Editando: ${b.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
        document.getElementById('err_capacidad').classList.add('d-none');
        document.getElementById('err_nombre').textContent = 'Campo requerido';
    };

    // ─────────────────────────────────────────
    // CANCELAR FORMULARIO — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_bodega').value    = '';
        document.getElementById('f_nombre').value       = '';
        document.getElementById('f_capacidad_ton').value = '';
        document.getElementById('f_descripcion').value  = '';
        document.getElementById('err_nombre').classList.add('d-none');
        document.getElementById('err_capacidad').classList.add('d-none');
        document.getElementById('err_nombre').textContent = 'Campo requerido';
    };

    // ─────────────────────────────────────────
    // GUARDAR (CREAR O ACTUALIZAR) — igual que tipo_equipo
    // ─────────────────────────────────────────
    window.guardarBodega = async function () {
    const id          = document.getElementById('f_pk_bodega').value;
    const nombre      = document.getElementById('f_nombre').value.trim();
    const capacidad   = parseFloat(document.getElementById('f_capacidad_ton').value);
    const estado = 'Operativo';
    const descripcion = document.getElementById('f_descripcion').value.trim();

    let valido = true;

    if (!nombre) {
        document.getElementById('err_nombre').classList.remove('d-none');
        document.getElementById('err_nombre').textContent = 'Campo requerido';
        valido = false;
    } else {
        const erroresNombre = validarFormato(nombre);
        if (erroresNombre.length) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('err_nombre').textContent = erroresNombre[0];
            valido = false;
        } else {
            document.getElementById('err_nombre').classList.add('d-none');
        }
    }

    if (!capacidad || capacidad <= 0) {
        document.getElementById('err_capacidad').classList.remove('d-none');
        valido = false;
    } else {
        document.getElementById('err_capacidad').classList.add('d-none');
    }

    if (!valido) return;

    const payload = { nombre, capacidad_ton: capacidad, estado, descripcion: descripcion || null };

    try {
        if (id) {
            await fetchWithAuth(`/bodega/${id}`, 'PUT', payload);
            Swal.fire({ icon: 'success', title: 'Actualizada', text: 'Bodega actualizada exitosamente', timer: 2000, showConfirmButton: false });
        } else {
            await fetchWithAuth('/bodega', 'POST', payload);
            Swal.fire({ icon: 'success', title: 'Registrada', text: 'Bodega creada exitosamente', timer: 2000, showConfirmButton: false });
        }
        cancelarFormulario();
        listar();
    } catch (error) {
        if (error.error?.includes('nombre') || error.message?.includes('nombre')) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('err_nombre').textContent = 'Ya existe una bodega con ese nombre';
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
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
            await listarMantenimiento();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();