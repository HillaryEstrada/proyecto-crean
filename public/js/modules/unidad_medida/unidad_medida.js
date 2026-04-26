(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('unidadBody', async () => {
        listar();
    }, 20, 'unidad_medida/unidad_medida');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('unidadBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/unidad-medida');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar unidades:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las unidades de medida' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('unidadBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-unidad');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="4" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-ruler fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay unidades de medida registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'unidadBody', filasPorPagina: 10, sufijo: 'unidad' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((u, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${u.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarUnidad(${u.pk_unidad})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${u.pk_unidad}, '${(u.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'unidadBody', filasPorPagina: 10, sufijo: 'unidad' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(u => {
            const txt = `${u.nombre} ${u.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('unidadBodyInactivos');
        const info   = document.getElementById('info-registros-unidad-inactivos');
        const filtrados = _registrosInactivos.filter(u => {
            const txt = `${u.nombre} ${u.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((u, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${u.nombre || '—'}</span></td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarUnidad(${u.pk_unidad}, '${(u.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'unidadBodyInactivos', filasPorPagina: 10, sufijo: 'unidad-inactivos' });
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
        const cuerpo = document.getElementById('unidadBodyInactivos');
        const info   = document.getElementById('info-registros-unidad-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="4" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/unidad-medida/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="4" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay unidades inactivas
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'unidadBodyInactivos', filasPorPagina: 10, sufijo: 'unidad-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((u, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${u.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${u.registrado_por_usuario || '—'}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarUnidad(${u.pk_unidad}, '${(u.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'unidadBodyInactivos', filasPorPagina: 10, sufijo: 'unidad-inactivos' });
        } catch (e) { console.error('Error inactivos unidad:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_unidad').value          = '';
        document.getElementById('f_nombre').value             = '';
        document.getElementById('formTitulo').textContent     = 'Registrar Unidad de Medida';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar unidad';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarUnidad = function (id) {
        const u = _registrosActivos.find(x => x.pk_unidad === id);
        if (!u) return;

        document.getElementById('f_pk_unidad').value          = u.pk_unidad;
        document.getElementById('f_nombre').value             = u.nombre || '';
        document.getElementById('formTitulo').textContent     = `Editando: ${u.nombre}`;
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
        document.getElementById('f_pk_unidad').value = '';
        document.getElementById('f_nombre').value    = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarUnidad = async function () {
        const id     = document.getElementById('f_pk_unidad').value;
        const nombre = document.getElementById('f_nombre').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        try {
            const payload = { nombre };

            if (id) {
                await fetchWithAuth(`/unidad-medida/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Unidad de medida actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/unidad-medida', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Unidad de medida creada exitosamente',
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
            await fetchWithAuth(`/unidad-medida/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivada',
                text: 'Unidad de medida desactivada exitosamente',
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
    window.reactivarUnidad = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar unidad',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/unidad-medida/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivada',
                text: 'Unidad de medida reactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

})();