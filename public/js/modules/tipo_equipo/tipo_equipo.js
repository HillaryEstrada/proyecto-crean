(function () {
    // quitar flag de inicialización
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('teBody', async () => {
        listar();
    }, 20, 'tipo_equipo/tipo_equipo');
    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('teBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/tipo-equipo');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch(e) {
            console.error('Error listar tipos:', e);
            Swal.fire({ icon:'error', title:'Error', text:'No se pudieron cargar los tipos de equipo' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla  = document.getElementById('teBody');
        const footer = document.getElementById('footerInfo');
        const info   = document.getElementById('info-registros-te');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="5" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-tags fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay tipos de equipo registrados
                </td></tr>`;
            if (footer) footer.textContent = '';
            if (info)   info.textContent   = 'Sin registros';
            initPaginacion({ tbodyId: 'teBody', filasPorPagina: 10, sufijo: 'te' });
            return;
        }

        if (footer) footer.textContent = '';
        if (info)   info.textContent   = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((t, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i+1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${t.nombre||'—'}
                    </span>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${t.registrado_por_usuario && t.fecha_registro
                        ? (() => { const s = String(t.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${t.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarTipo(${t.pk_tipo_equipo})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${t.pk_tipo_equipo}, '${(t.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'teBody', filasPorPagina: 10, sufijo: 'te' });
    }

    // ============================================
    // FILTRAR TABLA
    // ============================================
    window.filtrarTabla = function() {
        const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
        renderTabla(_registrosActivos.filter(t => {
            const txt = `${t.nombre} ${t.registrado_por_usuario||''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

        // ============================================
        // SWITCH TABS
        // ============================================
        window.switchTab = function(tab) {
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

        // ============================================
        // FILTRAR TABLA INACTIVOS
        // ============================================
        window.filtrarTablaInactivos = function() {
            const q = (document.getElementById('searchInputInactivos')?.value || '').toLowerCase();
            const cuerpo = document.getElementById('teBodyInactivos');
            const info   = document.getElementById('info-registros-te-inactivos');
            const filtrados = _registrosInactivos.filter(t => {
                const txt = `${t.nombre} ${t.registrado_por_usuario || ''}`.toLowerCase();
                return !q || txt.includes(q);
            });

            if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = filtrados.map((t, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i+1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${t.nombre||'—'}
                        </span>
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;">
                        ${t.registrado_por_usuario && t.fecha_registro
                            ? (() => { const s = String(t.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${t.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarTipo(${t.pk_tipo_equipo}, '${(t.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'teBodyInactivos', filasPorPagina: 10, sufijo: 'te-inactivos' });
        };
    // ============================================
    // LISTAR INACTIVOS
    // ============================================
    async function listarInactivos() {
        const cuerpo = document.getElementById('teBodyInactivos');
        const info   = document.getElementById('info-registros-te-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/tipo-equipo/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay tipos de equipo inactivos
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'teBodyInactivos', filasPorPagina: 10, sufijo: 'te-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((t, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i+1}</td>
                    <td class="px-3">
                        <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                            ${t.nombre||'—'}
                        </span>
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:12px;">
                        ${t.registrado_por_usuario && t.fecha_registro
                            ? (() => { const s = String(t.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${t.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                            : '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarTipo(${t.pk_tipo_equipo}, '${(t.nombre||'').replace(/'/g,"\\'")}')">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'teBodyInactivos', filasPorPagina: 10, sufijo: 'te-inactivos' });
        } catch(e) { console.error('Error inactivos:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function() {
        document.getElementById('f_pk_tipo_equipo').value         = '';
        document.getElementById('f_nombre').value                 = '';
        document.getElementById('formTitulo').textContent         = 'Registrar Tipo de Equipo';
        document.getElementById('btnGuardarLabel').textContent    = 'Guardar tipo';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR TIPO
    // ============================================
    window.editarTipo = function(id) {
        const t = _registrosActivos.find(x => x.pk_tipo_equipo === id);
        if (!t) return;

        document.getElementById('f_pk_tipo_equipo').value         = t.pk_tipo_equipo;
        document.getElementById('f_nombre').value                 = t.nombre||'';
        document.getElementById('formTitulo').textContent         = `Editando: ${t.nombre}`;
        document.getElementById('btnGuardarLabel').textContent    = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function() {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_tipo_equipo').value = '';
        document.getElementById('f_nombre').value         = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarTipo = async function() {
        const id     = document.getElementById('f_pk_tipo_equipo').value;
        const nombre = document.getElementById('f_nombre').value.trim();

    
        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        if (/^\d+$/.test(nombre)) {
    Swal.fire({
        icon: 'warning',
        title: 'Nombre inválido',
        text: 'El nombre no puede ser solo números',
        confirmButtonColor: '#1a3c5e'
    });
    document.getElementById('f_nombre').focus();
    return;
}

// Si empieza con letra, debe ser mayúscula
if (/^[a-záéíóúñ]/i.test(nombre) && nombre[0] !== nombre[0].toUpperCase()) {
    Swal.fire({
        icon: 'warning',
        title: 'Nombre inválido',
        text: 'Si el nombre empieza con letra, debe ser mayúscula',
        confirmButtonColor: '#1a3c5e'
    });
    document.getElementById('f_nombre').focus();
    return;
}

        try {
            if (id) {
                await fetchWithAuth(`/tipo-equipo/${id}`, 'PUT', { nombre });
                Swal.fire({ icon:'success', title:'Actualizado',
                    text:'Tipo de equipo actualizado exitosamente',
                    timer:2000, showConfirmButton:false });
            } else {
                await fetchWithAuth('/tipo-equipo', 'POST', { nombre });
                Swal.fire({ icon:'success', title:'Registrado',
                    text:'Tipo de equipo creado exitosamente',
                    timer:2000, showConfirmButton:false });
            }
            cancelarFormulario();
            listar();
        } catch(error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    // ============================================
    // ABRIR MODAL DESACTIVAR
    // ============================================
    window.abrirDesactivar = function(id, nombre) {
        _idParaDesactivar = id;
        document.getElementById('desactivarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    // ============================================
    // CONFIRMAR DESACTIVAR
    // ============================================
    window.confirmarDesactivar = async function() {
        try {
            await fetchWithAuth(`/tipo-equipo/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon:'success', title:'Desactivado',
                text:'Tipo de equipo desactivado exitosamente',
                timer:2000, showConfirmButton:false });
            listar();
        } catch(error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    // ============================================
    // REACTIVAR TIPO
    // ============================================
    window.reactivarTipo = async function(id, nombre) {
        const confirm = await Swal.fire({
            icon:              'question',
            title:             'Reactivar tipo',
            text:              `¿Deseas reactivar "${nombre}"?`,
            showCancelButton:   true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText:  'Cancelar',
            confirmButtonColor:'#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/tipo-equipo/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon:'success', title:'Reactivado',
                text:'Tipo de equipo reactivado exitosamente',
                timer:2000, showConfirmButton:false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch(error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

})();