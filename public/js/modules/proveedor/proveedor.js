(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('provBody', async () => {
        listar();
    }, 20, 'proveedor/proveedor');

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('provBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/proveedor');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar proveedores:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los proveedores' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('provBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-prov');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-truck fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay proveedores registrados
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'provBody', filasPorPagina: 10, sufijo: 'prov' });
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
                <td class="px-3 text-muted" style="font-size:13px;">${p.telefono || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.correo || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${p.direccion || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${p.registrado_por_usuario && p.fecha_registro
                        ? (() => { const s = String(p.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${p.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarProveedor(${p.pk_proveedor})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${p.pk_proveedor}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'provBody', filasPorPagina: 10, sufijo: 'prov' });
    }

    // ============================================
    // FILTRAR
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(p => {
            const txt = `${p.nombre} ${p.telefono||''} ${p.correo||''} ${p.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    window.filtrarTablaInactivos = function () {
    const q = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
    const cuerpo = document.getElementById('provBodyInactivos');
    const info   = document.getElementById('info-registros-prov-inactivos');
    const filtrados = _registrosInactivos.filter(p => {
        const txt = `${p.nombre} ${p.telefono||''} ${p.correo||''} ${p.registrado_por_usuario||''}`.toLowerCase();
        return !q || txt.includes(q);
    });

    if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

    cuerpo.innerHTML = filtrados.length ? filtrados.map((p, i) => `
        <tr>
            <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
            <td class="px-3"><span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">${p.nombre || '—'}</span></td>
            <td class="px-3 text-muted" style="font-size:13px;">${p.telefono || '—'}</td>
            <td class="px-3 text-muted" style="font-size:13px;">${p.correo || '—'}</td>
            <td class="px-3 text-muted" style="font-size:13px;">${p.direccion || '—'}</td>
            <td class="px-3 text-center text-muted" style="font-size:12px;">
                ${p.registrado_por_usuario && p.fecha_registro
                    ? (() => { const s = String(p.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${p.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                    : '—'}
            </td>
            <td class="px-3 text-center" style="white-space:nowrap;">
                <button class="btn btn-sm btn-outline-success" title="Reactivar"
                    onclick="reactivarProveedor(${p.pk_proveedor}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                    <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                </button>
            </td>
        </tr>`).join('')
    : `<tr><td colspan="7" class="text-center py-5 text-muted">
            <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
            Sin resultados
        </td></tr>`;

    initPaginacion({ tbodyId: 'provBodyInactivos', filasPorPagina: 10, sufijo: 'prov-inactivos' });
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
        const cuerpo = document.getElementById('provBodyInactivos');
        const info   = document.getElementById('info-registros-prov-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="7" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/proveedor/todos');
            _registrosInactivos = Array.isArray(data) ? data.filter(p => p.estado === 0) : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="7" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay proveedores inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'provBodyInactivos', filasPorPagina: 10, sufijo: 'prov-inactivos' });
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
                    <td class="px-3 text-muted" style="font-size:13px;">${p.telefono || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${p.correo || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${p.direccion || '—'}</td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;">
                            ${p.registrado_por_usuario && p.fecha_registro
                                ? (() => { const s = String(p.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${p.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                                : '—'}
                        </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarProveedor(${p.pk_proveedor}, '${(p.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'provBodyInactivos', filasPorPagina: 10, sufijo: 'prov-inactivos' });
        } catch (e) { console.error('Error inactivos proveedor:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_proveedor').value       = '';
        document.getElementById('f_nombre').value             = '';
        document.getElementById('f_telefono').value           = '';
        document.getElementById('f_correo').value             = '';
        document.getElementById('f_direccion').value          = '';
        document.getElementById('formTitulo').textContent     = 'Registrar Proveedor';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar proveedor';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarProveedor = function (id) {
        const p = _registrosActivos.find(x => x.pk_proveedor === id);
        if (!p) return;

        document.getElementById('f_pk_proveedor').value       = p.pk_proveedor;
        document.getElementById('f_nombre').value             = p.nombre || '';
        document.getElementById('f_telefono').value           = p.telefono || '';
        document.getElementById('f_correo').value             = p.correo || '';
        document.getElementById('f_direccion').value          = p.direccion || '';
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
        document.getElementById('f_pk_proveedor').value = '';
        document.getElementById('f_nombre').value       = '';
        document.getElementById('f_telefono').value     = '';
        document.getElementById('f_correo').value       = '';
        document.getElementById('f_direccion').value    = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarProveedor = async function () {
    const id        = document.getElementById('f_pk_proveedor').value;
    const nombre    = document.getElementById('f_nombre').value.trim();
    const telefono  = document.getElementById('f_telefono').value.trim();
    const correo    = document.getElementById('f_correo').value.trim();
    const direccion = document.getElementById('f_direccion').value.trim();

    // 1 ── Nombre vacío
    if (!nombre) {
        document.getElementById('err_nombre').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
        return;
    }
    document.getElementById('err_nombre').classList.add('d-none');

    // ── Teléfono obligatorio ──
    if (!telefono) {
    document.getElementById('err_telefono').textContent = 'Campo requerido';
    document.getElementById('err_telefono').classList.remove('d-none');
    document.getElementById('f_telefono').focus();
    return;
    }
    // ← AGREGA ESTO:
    if (telefono.replace(/\D/g, '').length < 10) {
        document.getElementById('err_telefono').textContent = 'El teléfono debe tener 10 dígitos';
        document.getElementById('err_telefono').classList.remove('d-none');
        document.getElementById('f_telefono').focus();
        return;
    }
    document.getElementById('err_telefono').classList.add('d-none');
    // 2 ── Formato nombre
    const erroresNombre = validarFormato(nombre);
    if (erroresNombre.length) {
        Swal.fire({ icon: 'warning', title: 'Revisa el nombre',
            html: erroresNombre.map(e => `<div>• ${e}</div>`).join(''),
            confirmButtonColor: '#1a3c5e' });
        document.getElementById('f_nombre').focus();
        return;
    }

    // 3 ── Correo
    if (correo && !validarCorreo(correo)) {
        Swal.fire({ icon: 'warning', title: 'Correo inválido',
            text: 'Ingresa un correo válido. Ej: contacto@proveedor.com',
            confirmButtonColor: '#1a3c5e' });
        document.getElementById('f_correo').focus();
        return;
    }

    // 4 ── Guardar
    try {
        const payload = {
            nombre,
            telefono:  telefono  || null,
            correo:    correo    || null,
            direccion: direccion || null
        };

        if (id) {
            await fetchWithAuth(`/proveedor/${id}`, 'PUT', payload);
            Swal.fire({ icon: 'success', title: 'Actualizado',
                text: 'Proveedor actualizado exitosamente',
                timer: 2000, showConfirmButton: false });
        } else {
            await fetchWithAuth('/proveedor', 'POST', payload);
            Swal.fire({ icon: 'success', title: 'Registrado',
                text: 'Proveedor creado exitosamente',
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
            await fetchWithAuth(`/proveedor/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Proveedor desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarProveedor = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar proveedor',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/proveedor/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Proveedor reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();