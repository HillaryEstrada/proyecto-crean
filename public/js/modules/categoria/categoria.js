(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _pkParaDesactivar   = null;

    esperarElemento('categoriaBody', async () => {
        listar();
    }, 20, 'categoria/categoria');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('categoriaBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/categorias');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar categorias:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las categorías' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('categoriaBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-categoria');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="5" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-tags fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay categorías registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'categoriaBody', filasPorPagina: 10, sufijo: 'categoria' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((c, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center">
                    <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                        ${c.clave || '—'}
                    </span>
                </td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${c.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                    ${c.registrado_por_usuario || '—'} • ${c.fecha_registro
                        ? new Date(c.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarCategoria(${c.pk_categoria})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${c.pk_categoria}, '${(c.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'categoriaBody', filasPorPagina: 10, sufijo: 'categoria' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(c => {
            const txt = `${c.clave} ${c.nombre} ${c.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('categoriaBodyInactivos');
        const info   = document.getElementById('info-registros-categoria-inactivos');
        const filtrados = _registrosInactivos.filter(c => {
            const txt = `${c.clave} ${c.nombre} ${c.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((c, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center">
                    <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                        ${c.clave || '—'}
                    </span>
                </td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${c.nombre || '—'}</span></td>
                <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                    ${c.registrado_por_usuario || '—'} • ${c.fecha_registro
                        ? new Date(c.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarCategoria(${c.pk_categoria}, '${(c.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="5" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'categoriaBodyInactivos', filasPorPagina: 10, sufijo: 'categoria-inactivos' });
    };

    // ============================================
    // SWITCH TABS
    // ============================================
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
            const si = document.getElementById('searchInputInactivos');
            if (si) si.value = '';
            listarInactivos();
        }
    };

    // ============================================
    // LISTAR INACTIVOS
    // ============================================
    async function listarInactivos() {
        const cuerpo = document.getElementById('categoriaBodyInactivos');
        const info   = document.getElementById('info-registros-categoria-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/categorias/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay categorías inactivas
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'categoriaBodyInactivos', filasPorPagina: 10, sufijo: 'categoria-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((c, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3 text-center">
                        <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                            ${c.clave || '—'}
                        </span>
                    </td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${c.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                        ${c.registrado_por_usuario || '—'} • ${c.fecha_registro
                            ? new Date(c.fecha_registro).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarCategoria(${c.pk_categoria}, '${(c.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'categoriaBodyInactivos', filasPorPagina: 10, sufijo: 'categoria-inactivos' });
        } catch (e) { console.error('Error inactivos categoria:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_original').value         = '';
        document.getElementById('f_clave').value                = '';
        document.getElementById('f_nombre').value               = '';
        document.getElementById('f_clave').disabled             = false;
        document.getElementById('formTitulo').textContent       = 'Registrar Categoría';
        document.getElementById('btnGuardarLabel').textContent  = 'Guardar categoría';
        document.getElementById('err_clave').classList.add('d-none');
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_clave').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarCategoria = function (pk_categoria) {
        const c = _registrosActivos.find(x => x.pk_categoria === pk_categoria);
        if (!c) return;

        document.getElementById('f_pk_original').value          = c.pk_categoria;
        document.getElementById('f_clave').value                = c.clave;
        document.getElementById('f_nombre').value                = c.nombre || '';
        document.getElementById('f_clave').disabled              = false;
        document.getElementById('formTitulo').textContent        = `Editando: ${c.clave} — ${c.nombre}`;
        document.getElementById('btnGuardarLabel').textContent   = 'Guardar cambios';
        document.getElementById('err_clave').classList.add('d-none');
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_clave').focus();
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_original').value = '';
        document.getElementById('f_clave').value       = '';
        document.getElementById('f_nombre').value      = '';
        document.getElementById('f_clave').disabled    = false;
        document.getElementById('err_clave').classList.add('d-none');
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarCategoria = async function () {
        const pkOriginal = document.getElementById('f_pk_original').value;
        const clave  = document.getElementById('f_clave').value.trim();
        const nombre = document.getElementById('f_nombre').value.trim();

        let valido = true;

        // Validar clave
        if (!clave) {
            document.getElementById('err_clave').classList.remove('d-none');
            document.getElementById('err_clave').textContent = 'Campo requerido';
            valido = false;
        } else if (!/^\d+$/.test(clave)) {
            document.getElementById('err_clave').classList.remove('d-none');
            document.getElementById('err_clave').textContent = 'La clave solo debe contener números';
            valido = false;
        } else {
            document.getElementById('err_clave').classList.add('d-none');
        }

        // Validar nombre con validarFormato global
        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('err_nombre').textContent = 'Campo requerido';
            valido = false;
        } else {
            const errs = validarFormato(nombre);
            if (errs.length) {
                document.getElementById('err_nombre').classList.remove('d-none');
                document.getElementById('err_nombre').textContent = errs[0];
                valido = false;
            } else {
                document.getElementById('err_nombre').classList.add('d-none');
            }
        }

        if (!valido) return;

        try {
            const payload = { clave, nombre };
            if (pkOriginal) {
                await fetchWithAuth(`/categorias/${pkOriginal}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Categoría actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/categorias', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Categoría creada exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            listar();
        } catch (error) {
            const msg = error.error || error.message || '';
            if (msg.includes('clave')) {
                document.getElementById('err_clave').classList.remove('d-none');
                document.getElementById('err_clave').textContent = msg;
            } else if (msg.includes('nombre')) {
                document.getElementById('err_nombre').classList.remove('d-none');
                document.getElementById('err_nombre').textContent = msg;
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: msg });
            }
        }
    };

    // ============================================
    // ABRIR MODAL DESACTIVAR
    // ============================================
    window.abrirDesactivar = function (pk_categoria, nombre) {
        _pkParaDesactivar = pk_categoria;
        document.getElementById('desactivarNombre').textContent = `${nombre}`;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    // ============================================
    // CONFIRMAR DESACTIVAR
    // ============================================
    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/categorias/${_pkParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivada',
                text: 'Categoría desactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            _pkParaDesactivar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarCategoria = async function (pk_categoria, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar categoría',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/categorias/${pk_categoria}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivada',
                text: 'Categoría reactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

})();