(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _ejidos             = [];
    let _idParaDesactivar   = null;

    esperarElemento('predioBody', async () => {
        await cargarEjidos();
        listar();
    }, 20, 'predio/predio');

    // ============================================
    // CARGAR EJIDOS PARA EL SELECT
    // ============================================
    async function cargarEjidos() {
        try {
            const data = await fetchWithAuth('/ejido');
            _ejidos    = Array.isArray(data) ? data : [];
            const select = document.getElementById('f_fk_ejido');
            if (!select) return;
            select.innerHTML = `<option value="">— Sin ejido —</option>` +
                _ejidos.map(e =>
                    `<option value="${e.pk_ejido}">${e.nombre}</option>`
                ).join('');
        } catch (e) { console.error('Error cargar ejidos:', e); }
    }

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('predioBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/predio');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar predios:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los predios' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('predioBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-predio');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="5" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-map-location-dot fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay predios registrados
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'predioBody', filasPorPagina: 10, sufijo: 'predio' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${p.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.ejido_nombre || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarPredio(${p.pk_predio})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${p.pk_predio}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'predioBody', filasPorPagina: 10, sufijo: 'predio' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(p => {
            const txt = `${p.nombre} ${p.ejido_nombre||''} ${p.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('predioBodyInactivos');
        const info   = document.getElementById('info-registros-predio-inactivos');
        const filtrados = _registrosInactivos.filter(p => {
            const txt = `${p.nombre} ${p.ejido_nombre||''} ${p.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${p.nombre || '—'}</span></td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.ejido_nombre || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarPredio(${p.pk_predio}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="5" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'predioBodyInactivos', filasPorPagina: 10, sufijo: 'predio-inactivos' });
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
        const cuerpo = document.getElementById('predioBodyInactivos');
        const info   = document.getElementById('info-registros-predio-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/predio/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay predios inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'predioBodyInactivos', filasPorPagina: 10, sufijo: 'predio-inactivos' });
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
                    <td class="px-3 text-muted" style="font-size:13px;">${p.ejido_nombre || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarPredio(${p.pk_predio}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'predioBodyInactivos', filasPorPagina: 10, sufijo: 'predio-inactivos' });
        } catch (e) { console.error('Error inactivos predio:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_predio').value          = '';
        document.getElementById('f_nombre').value             = '';
        document.getElementById('f_fk_ejido').value           = '';
        document.getElementById('formTitulo').textContent     = 'Registrar Predio';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar predio';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarPredio = function (id) {
        const p = _registrosActivos.find(x => x.pk_predio === id);
        if (!p) return;

        document.getElementById('f_pk_predio').value          = p.pk_predio;
        document.getElementById('f_nombre').value             = p.nombre || '';
        document.getElementById('f_fk_ejido').value           = p.fk_ejido || '';
        document.getElementById('formTitulo').textContent     = `Editando: ${p.nombre}`;
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
        document.getElementById('f_pk_predio').value = '';
        document.getElementById('f_nombre').value    = '';
        document.getElementById('f_fk_ejido').value  = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarPredio = async function () {
        const id       = document.getElementById('f_pk_predio').value;
        const nombre   = document.getElementById('f_nombre').value.trim();
        const fk_ejido = document.getElementById('f_fk_ejido').value;

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        try {
            const payload = {
                nombre,
                fk_ejido: fk_ejido || null
            };

            if (id) {
                await fetchWithAuth(`/predio/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Predio actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/predio', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Predio creado exitosamente',
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
            await fetchWithAuth(`/predio/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Predio desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarPredio = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar predio',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/predio/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Predio reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

})();