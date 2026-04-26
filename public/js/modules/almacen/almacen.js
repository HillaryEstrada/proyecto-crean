(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('almacenBody', async () => {
        listar();
    }, 20, 'almacen/almacen');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('almacenBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/almacen');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar almacenes:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los almacenes' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('almacenBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-almacen');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="5" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-warehouse fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay almacenes registrados
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'almacenBody', filasPorPagina: 10, sufijo: 'almacen' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((a, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${a.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.descripcion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarAlmacen(${a.pk_almacen})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${a.pk_almacen}, '${(a.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'almacenBody', filasPorPagina: 10, sufijo: 'almacen' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(a => {
            const txt = `${a.nombre} ${a.descripcion||''} ${a.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('almacenBodyInactivos');
        const info   = document.getElementById('info-registros-almacen-inactivos');
        const filtrados = _registrosInactivos.filter(a => {
            const txt = `${a.nombre} ${a.descripcion||''} ${a.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((a, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${a.nombre || '—'}</span></td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.descripcion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarAlmacen(${a.pk_almacen}, '${(a.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="5" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'almacenBodyInactivos', filasPorPagina: 10, sufijo: 'almacen-inactivos' });
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
        const cuerpo = document.getElementById('almacenBodyInactivos');
        const info   = document.getElementById('info-registros-almacen-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/almacen/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay almacenes inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'almacenBodyInactivos', filasPorPagina: 10, sufijo: 'almacen-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((a, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${a.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${a.descripcion || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${a.registrado_por_usuario || '—'}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarAlmacen(${a.pk_almacen}, '${(a.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'almacenBodyInactivos', filasPorPagina: 10, sufijo: 'almacen-inactivos' });
        } catch (e) { console.error('Error inactivos almacen:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_almacen').value         = '';
        document.getElementById('f_nombre').value             = '';
        document.getElementById('f_descripcion').value        = '';
        document.getElementById('formTitulo').textContent     = 'Registrar Almacén';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar almacén';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarAlmacen = function (id) {
        const a = _registrosActivos.find(x => x.pk_almacen === id);
        if (!a) return;

        document.getElementById('f_pk_almacen').value         = a.pk_almacen;
        document.getElementById('f_nombre').value             = a.nombre      || '';
        document.getElementById('f_descripcion').value        = a.descripcion || '';
        document.getElementById('formTitulo').textContent     = `Editando: ${a.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_almacen').value  = '';
        document.getElementById('f_nombre').value      = '';
        document.getElementById('f_descripcion').value = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarAlmacen = async function () {
        const id          = document.getElementById('f_pk_almacen').value;
        const nombre      = document.getElementById('f_nombre').value.trim();
        const descripcion = document.getElementById('f_descripcion').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        try {
            const payload = {
                nombre,
                descripcion: descripcion || null
            };

            if (id) {
                await fetchWithAuth(`/almacen/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Almacén actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/almacen', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Almacén creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }

            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ============================================
    // ABRIR MODAL DESACTIVAR
    // ============================================
    window.abrirDesactivar = function (id, nombre) {
        _idParaDesactivar = id;
        document.getElementById('desactivarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    // ============================================
    // CONFIRMAR DESACTIVAR
    // ============================================
    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/almacen/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Almacén desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            _idParaDesactivar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarAlmacen = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar almacén',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/almacen/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Almacén reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

})();