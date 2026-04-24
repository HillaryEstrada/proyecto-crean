(function () {

    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('prodBody', async () => {
        listar();
    }, 20, 'productor/productor');

    // ─────────────────────────────────────────
    // LISTAR ACTIVOS
    // ─────────────────────────────────────────
    async function listar() {
        const tabla = document.getElementById('prodBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/productor');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar productores:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los productores' });
        }
    }

    // ─────────────────────────────────────────
    // RENDER TABLA ACTIVOS
    // ─────────────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('prodBody');
        const footer = document.getElementById('footerInfo');
        const info   = document.getElementById('info-registros-prod');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-user-tie fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay productores registrados
                </td></tr>`;
            if (footer) footer.textContent = '';
            if (info)   info.textContent   = 'Sin registros';
            initPaginacion({ tbodyId: 'prodBody', filasPorPagina: 10, sufijo: 'prod' });
            return;
        }

        if (footer) footer.textContent = '';
        if (info)   info.textContent   = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${p.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${p.telefono || '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">
                    ${p.observaciones || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${p.registrado_por_usuario || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${p.fecha_registro
                        ? new Date(p.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarProductor(${p.pk_productor})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${p.pk_productor}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'prodBody', filasPorPagina: 10, sufijo: 'prod' });
    }

    // ─────────────────────────────────────────
    // FILTRAR ACTIVOS
    // ─────────────────────────────────────────
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(p => {
            const txt = `${p.nombre} ${p.telefono || ''} ${p.observaciones || ''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ─────────────────────────────────────────
    // TABS
    // ─────────────────────────────────────────
    window.switchTab = function (tab) {
        const va = document.getElementById('vistaActivos');
        const vi = document.getElementById('vistaInactivos');
        const ta = document.getElementById('tabActivos');
        const ti = document.getElementById('tabInactivos');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vi.classList.add('d-none');
            ta.classList.add('active');    ti.classList.remove('active');
        } else {
            va.classList.add('d-none');    vi.classList.remove('d-none');
            ta.classList.remove('active'); ti.classList.add('active');
            listarInactivos();
        }
    };

    // ─────────────────────────────────────────
    // LISTAR INACTIVOS
    // ─────────────────────────────────────────
    async function listarInactivos() {
        const cuerpo = document.getElementById('prodBodyInactivos');
        const info   = document.getElementById('info-registros-prod-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data          = await fetchWithAuth('/productor/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="7" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay productores inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'prodBodyInactivos', filasPorPagina: 10, sufijo: 'prod-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((p, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${p.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${p.telefono || '—'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">
                        ${p.observaciones || '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${p.registrado_por_usuario || '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;">
                        ${p.fecha_registro
                            ? new Date(p.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarProductor(${p.pk_productor}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'prodBodyInactivos', filasPorPagina: 10, sufijo: 'prod-inactivos' });
        } catch (e) { console.error('Error inactivos:', e); }
    }

    // ─────────────────────────────────────────
    // FILTRAR INACTIVOS
    // ─────────────────────────────────────────
    window.filtrarInactivos = function () {
        const q      = (document.getElementById('searchInactivos')?.value || '').toLowerCase();
        const info   = document.getElementById('info-registros-prod-inactivos');
        const filtrados = _registrosInactivos.filter(p => {
            const txt = `${p.nombre} ${p.telefono || ''} ${p.observaciones || ''}`.toLowerCase();
            return !q || txt.includes(q);
        });
        const cuerpo = document.getElementById('prodBodyInactivos');
        if (!cuerpo) return;
        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;
        cuerpo.innerHTML = filtrados.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${p.nombre || '—'}</span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${p.telefono || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">${p.observaciones || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${p.fecha_registro
                        ? new Date(p.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarProductor(${p.pk_productor}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'prodBodyInactivos', filasPorPagina: 10, sufijo: 'prod-inactivos' });
    };

    // ─────────────────────────────────────────
    // ABRIR FORMULARIO (CREAR)
    // ─────────────────────────────────────────
    window.abrirFormulario = function () {
        document.getElementById('f_pk_productor').value    = '';
        document.getElementById('f_nombre').value          = '';
        document.getElementById('f_telefono').value        = '';
        document.getElementById('f_observaciones').value   = '';
        document.getElementById('formTitulo').textContent  = 'Registrar Productor';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar productor';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ─────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────
    window.editarProductor = function (id) {
        const p = _registrosActivos.find(x => x.pk_productor === id);
        if (!p) return;

        document.getElementById('f_pk_productor').value    = p.pk_productor;
        document.getElementById('f_nombre').value          = p.nombre || '';
        document.getElementById('f_telefono').value        = p.telefono || '';
        document.getElementById('f_observaciones').value   = p.observaciones || '';
        document.getElementById('formTitulo').textContent  = `Editando: ${p.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ─────────────────────────────────────────
    // CANCELAR FORMULARIO
    // ─────────────────────────────────────────
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_productor').value  = '';
        document.getElementById('f_nombre').value        = '';
        document.getElementById('f_telefono').value      = '';
        document.getElementById('f_observaciones').value = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ─────────────────────────────────────────
    // GUARDAR (CREAR O ACTUALIZAR)
    // ─────────────────────────────────────────
    window.guardarProductor = async function () {
        const id           = document.getElementById('f_pk_productor').value;
        const nombre       = document.getElementById('f_nombre').value.trim();
        const telefono     = document.getElementById('f_telefono').value.trim();
        const observaciones = document.getElementById('f_observaciones').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        const payload = {
            nombre,
            telefono:      telefono      || null,
            observaciones: observaciones || null
        };

        try {
            if (id) {
                await fetchWithAuth(`/productor/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Productor actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/productor', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Productor creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ─────────────────────────────────────────
    // DESACTIVAR
    // ─────────────────────────────────────────
    window.abrirDesactivar = function (id, nombre) {
        _idParaDesactivar = id;
        document.getElementById('desactivarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/productor/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Productor desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            _idParaDesactivar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ─────────────────────────────────────────
    // REACTIVAR
    // ─────────────────────────────────────────
    window.reactivarProductor = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon:              'question',
            title:             'Reactivar productor',
            text:              `¿Deseas reactivar "${nombre}"?`,
            showCancelButton:   true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText:  'Cancelar',
            confirmButtonColor:'#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/productor/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Productor reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();