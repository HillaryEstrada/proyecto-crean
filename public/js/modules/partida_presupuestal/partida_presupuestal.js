(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _claveParaDesactivar = null;

    esperarElemento('partidaBody', async () => {
        listar();
    }, 20, 'partida_presupuestal/partida_presupuestal');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('partidaBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/partida-presupuestal');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar partidas:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las partidas presupuestales' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('partidaBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-partida');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="5" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-invoice-dollar fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay partidas presupuestales registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'partidaBody', filasPorPagina: 10, sufijo: 'partida' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center">
                    <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                        ${p.clave || '—'}
                    </span>
                </td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${p.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarPartida('${p.clave}')">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar('${p.clave}', '${(p.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'partidaBody', filasPorPagina: 10, sufijo: 'partida' });
    }

    // ============================================
    // FILTRAR ACTIVOS
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(p => {
            const txt = `${p.clave} ${p.nombre} ${p.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // FILTRAR INACTIVOS
    // ============================================
    window.filtrarTablaInactivos = function () {
        const q      = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('partidaBodyInactivos');
        const info   = document.getElementById('info-registros-partida-inactivos');
        const filtrados = _registrosInactivos.filter(p => {
            const txt = `${p.clave} ${p.nombre} ${p.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        });

        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

        cuerpo.innerHTML = filtrados.length ? filtrados.map((p, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center">
                    <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                        ${p.clave || '—'}
                    </span>
                </td>
                <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${p.nombre || '—'}</span></td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarPartida('${p.clave}', '${(p.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('')
        : `<tr><td colspan="5" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin resultados
            </td></tr>`;

        initPaginacion({ tbodyId: 'partidaBodyInactivos', filasPorPagina: 10, sufijo: 'partida-inactivos' });
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
        const cuerpo = document.getElementById('partidaBodyInactivos');
        const info   = document.getElementById('info-registros-partida-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/partida-presupuestal/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay partidas inactivas
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'partidaBodyInactivos', filasPorPagina: 10, sufijo: 'partida-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((p, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3 text-center">
                        <span class="badge fw-semibold px-3 py-2" style="background:#e8f0fb;color:#1a3c5e;font-size:12px;">
                            ${p.clave || '—'}
                        </span>
                    </td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${p.nombre || '—'}
                        </span>
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${p.registrado_por_usuario || '—'}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarPartida('${p.clave}', '${(p.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'partidaBodyInactivos', filasPorPagina: 10, sufijo: 'partida-inactivos' });
        } catch (e) { console.error('Error inactivos partida:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_clave_original').value      = '';
        document.getElementById('f_clave').value               = '';
        document.getElementById('f_nombre').value              = '';
        document.getElementById('f_clave').disabled            = false;
        document.getElementById('formTitulo').textContent      = 'Registrar Partida Presupuestal';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar partida';
        document.getElementById('err_clave').classList.add('d-none');
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_clave').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarPartida = function (clave) {
        const p = _registrosActivos.find(x => x.clave === clave);
        if (!p) return;

        document.getElementById('f_clave_original').value      = p.clave;
        document.getElementById('f_clave').value               = p.clave;
        document.getElementById('f_nombre').value              = p.nombre || '';
        document.getElementById('f_clave').disabled            = false; // ← clave editable
        document.getElementById('formTitulo').textContent      = `Editando: ${p.clave} — ${p.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
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
        document.getElementById('f_clave_original').value = '';
        document.getElementById('f_clave').value          = '';
        document.getElementById('f_nombre').value         = '';
        document.getElementById('f_clave').disabled       = false;
        document.getElementById('err_clave').classList.add('d-none');
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarPartida = async function () {
        const claveOriginal = document.getElementById('f_clave_original').value;
        const clave  = document.getElementById('f_clave').value.trim();
        const nombre = document.getElementById('f_nombre').value.trim();

        let valido = true;
        if (!clave) {
            document.getElementById('err_clave').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_clave').classList.add('d-none');

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_nombre').classList.add('d-none');

        if (!valido) return;

        try {
            const payload = { clave, nombre };

            if (claveOriginal) {
                // ACTUALIZAR — se manda la clave original como :id
                await fetchWithAuth(`/partida-presupuestal/${claveOriginal}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Partida actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                // CREAR
                await fetchWithAuth('/partida-presupuestal', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Partida creada exitosamente',
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
    window.abrirDesactivar = function (clave, nombre) {
        _claveParaDesactivar = clave;
        document.getElementById('desactivarNombre').textContent = `${clave} — ${nombre}`;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    // ============================================
    // CONFIRMAR DESACTIVAR
    // ============================================
    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/partida-presupuestal/${_claveParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivada',
                text: 'Partida desactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            _claveParaDesactivar = null;
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarPartida = async function (clave, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar partida',
            text: `¿Deseas reactivar "${clave} — ${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/partida-presupuestal/${clave}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivada',
                text: 'Partida reactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

})();