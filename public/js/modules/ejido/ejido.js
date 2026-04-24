(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('ejidoBody', async () => {
        listar();
    }, 20, 'ejido/ejido');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('ejidoBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/ejido');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar ejidos:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los ejidos' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('ejidoBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-ejido');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-land-mine-on fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay ejidos registrados
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'ejidoBody', filasPorPagina: 10, sufijo: 'ejido' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((e, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${e.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.municipio || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.estado || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.direccion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarEjido(${e.pk_ejido})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${e.pk_ejido}, '${(e.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'ejidoBody', filasPorPagina: 10, sufijo: 'ejido' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(e => {
            const txt = `${e.nombre} ${e.municipio||''} ${e.estado||''} ${e.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('ejidoBodyInactivos');
        const info   = document.getElementById('info-registros-ejido-inactivos');
        const filtrados = _registrosInactivos.filter(e => {
            const txt = `${e.nombre} ${e.municipio||''} ${e.estado||''} ${e.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((e, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${e.nombre || '—'}</span></td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.municipio || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.estado || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.direccion || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarEjido(${e.pk_ejido}, '${(e.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="7" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'ejidoBodyInactivos', filasPorPagina: 10, sufijo: 'ejido-inactivos' });
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
        const cuerpo = document.getElementById('ejidoBodyInactivos');
        const info   = document.getElementById('info-registros-ejido-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="7" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/ejido/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="7" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay ejidos inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'ejidoBodyInactivos', filasPorPagina: 10, sufijo: 'ejido-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((e, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${e.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.municipio || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.estado || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.direccion || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.registrado_por_usuario || '—'}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarEjido(${e.pk_ejido}, '${(e.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'ejidoBodyInactivos', filasPorPagina: 10, sufijo: 'ejido-inactivos' });
        } catch (e) { console.error('Error inactivos ejido:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_ejido').value          = '';
        document.getElementById('f_nombre').value            = '';
        document.getElementById('f_municipio').value         = '';
        document.getElementById('f_estado').value            = '';
        document.getElementById('f_direccion').value         = '';
        document.getElementById('formTitulo').textContent    = 'Registrar Ejido';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar ejido';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarEjido = function (id) {
        const e = _registrosActivos.find(x => x.pk_ejido === id);
        if (!e) return;

        document.getElementById('f_pk_ejido').value          = e.pk_ejido;
        document.getElementById('f_nombre').value            = e.nombre || '';
        document.getElementById('f_municipio').value         = e.municipio || '';
        document.getElementById('f_estado').value            = e.estado || '';
        document.getElementById('f_direccion').value         = e.direccion || '';
        document.getElementById('formTitulo').textContent    = `Editando: ${e.nombre}`;
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
        document.getElementById('f_pk_ejido').value  = '';
        document.getElementById('f_nombre').value    = '';
        document.getElementById('f_municipio').value = '';
        document.getElementById('f_estado').value    = '';
        document.getElementById('f_direccion').value = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarEjido = async function () {
        const id        = document.getElementById('f_pk_ejido').value;
        const nombre    = document.getElementById('f_nombre').value.trim();
        const municipio = document.getElementById('f_municipio').value.trim();
        const estado    = document.getElementById('f_estado').value.trim();
        const direccion = document.getElementById('f_direccion').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        try {
            const payload = {
                nombre,
                municipio: municipio || null,
                estado:    estado    || null,
                direccion: direccion || null
            };

            if (id) {
                await fetchWithAuth(`/ejido/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Ejido actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/ejido', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Ejido creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }

            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
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
            await fetchWithAuth(`/ejido/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Ejido desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarEjido = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar ejido',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/ejido/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Ejido reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();