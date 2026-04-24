(function () {

    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('prodBody', async () => {
        listar();
    }, 20, 'inventario/bodega_producto');

    // ─────────────────────────────────────────
    // LISTAR ACTIVOS
    // ─────────────────────────────────────────
    async function listar() {
        const tabla = document.getElementById('prodBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/bodega_producto');
            _registrosActivos = Array.isArray(data) ? data : [];
            poblarFiltroTipo(_registrosActivos);
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar productos:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los productos' });
        }
    }

    // ─────────────────────────────────────────
    // POBLAR FILTRO TIPO DE GRANO
    // ─────────────────────────────────────────
    function poblarFiltroTipo(data) {
        const sel = document.getElementById('filtroTipo');
        if (!sel) return;
        const valorActual = sel.value;
        // Mantener primera opción
        sel.innerHTML = '<option value="">Todos los tipos</option>';
        const tipos = [...new Set(data.map(p => p.tipo_grano).filter(Boolean))].sort();
        tipos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            sel.appendChild(opt);
        });
        sel.value = valorActual;
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
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-box fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay productos registrados
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
                <td class="px-3 text-center" style="font-size:13px;">
                    ${p.tipo_grano
                        ? `<span class="badge bg-info text-dark" style="font-size:11px;">${p.tipo_grano}</span>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-muted text-center" style="font-size:13px;">
                    ${p.variedad || '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                    ${p.descripcion || '—'}
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
                        onclick="editarProducto(${p.pk_producto})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${p.pk_producto}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
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
        const q    = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipo')?.value || '';
        renderTabla(_registrosActivos.filter(p => {
            const txt = `${p.nombre} ${p.tipo_grano || ''} ${p.variedad || ''} ${p.descripcion || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || p.tipo_grano === tipo);
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
        cuerpo.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data          = await fetchWithAuth('/bodega_producto/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="8" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay productos inactivos
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
                    <td class="px-3 text-center" style="font-size:13px;">
                        ${p.tipo_grano
                            ? `<span class="badge bg-secondary" style="font-size:11px;">${p.tipo_grano}</span>`
                            : '<span class="text-muted">—</span>'}
                    </td>
                    <td class="px-3 text-muted text-center" style="font-size:13px;">
                        ${p.variedad || '—'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">
                        ${p.descripcion || '—'}
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
                            onclick="reactivarProducto(${p.pk_producto}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
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
        const q    = (document.getElementById('searchInactivos')?.value || '').toLowerCase();
        const info = document.getElementById('info-registros-prod-inactivos');
        const filtrados = _registrosInactivos.filter(p => {
            const txt = `${p.nombre} ${p.tipo_grano || ''} ${p.variedad || ''}`.toLowerCase();
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
                <td class="px-3 text-center" style="font-size:13px;">
                    ${p.tipo_grano
                        ? `<span class="badge bg-secondary" style="font-size:11px;">${p.tipo_grano}</span>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-muted text-center" style="font-size:13px;">${p.variedad || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:220px;">${p.descripcion || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${p.fecha_registro
                        ? new Date(p.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarProducto(${p.pk_producto}, '${(p.nombre || '').replace(/'/g, "\\'")}')">
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
        document.getElementById('f_pk_producto').value     = '';
        document.getElementById('f_nombre').value          = '';
        document.getElementById('f_tipo_grano').value      = '';
        document.getElementById('f_variedad').value        = '';
        document.getElementById('f_descripcion').value     = '';
        document.getElementById('formTitulo').textContent  = 'Registrar Producto';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar producto';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ─────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────
    window.editarProducto = function (id) {
        const p = _registrosActivos.find(x => x.pk_producto === id);
        if (!p) return;

        document.getElementById('f_pk_producto').value     = p.pk_producto;
        document.getElementById('f_nombre').value          = p.nombre || '';
        document.getElementById('f_tipo_grano').value      = p.tipo_grano || '';
        document.getElementById('f_variedad').value        = p.variedad || '';
        document.getElementById('f_descripcion').value     = p.descripcion || '';
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
        document.getElementById('f_pk_producto').value = '';
        document.getElementById('f_nombre').value      = '';
        document.getElementById('f_tipo_grano').value  = '';
        document.getElementById('f_variedad').value    = '';
        document.getElementById('f_descripcion').value = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ─────────────────────────────────────────
    // GUARDAR (CREAR O ACTUALIZAR)
    // ─────────────────────────────────────────
    window.guardarProducto = async function () {
        const id          = document.getElementById('f_pk_producto').value;
        const nombre      = document.getElementById('f_nombre').value.trim();
        const tipo_grano  = document.getElementById('f_tipo_grano').value.trim();
        const variedad    = document.getElementById('f_variedad').value.trim();
        const descripcion = document.getElementById('f_descripcion').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        const payload = {
            nombre,
            tipo_grano:  tipo_grano  || null,
            variedad:    variedad    || null,
            descripcion: descripcion || null
        };

        try {
            if (id) {
                await fetchWithAuth(`/bodega_producto/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Producto actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/bodega_producto', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Producto creado exitosamente',
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
            await fetchWithAuth(`/bodega_producto/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Producto desactivado exitosamente',
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
    window.reactivarProducto = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon:              'question',
            title:             'Reactivar producto',
            text:              `¿Deseas reactivar "${nombre}"?`,
            showCancelButton:   true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText:  'Cancelar',
            confirmButtonColor:'#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/bodega_producto/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Producto reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();