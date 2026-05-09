(function () {

    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('prodBody', async () => {
        await cargarEjidosEnSelect();
        await cargarPrediosEnSelect();
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
                <tr><td colspan="9" class="text-center py-5 text-muted">
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
            <td class="px-3 text-muted" style="font-size:12px;letter-spacing:.05em;">
                ${p.curp || '—'}
            </td>
            <td class="px-3 text-center text-muted" style="font-size:13px;">
                ${p.telefono || '—'}
            </td>
            <td class="px-3 text-muted" style="font-size:13px;">
                ${p.ejido_nombre || '—'}
            </td>
            <td class="px-3 text-muted" style="font-size:13px;">
                ${p.predio_nombre || '—'}
            </td>
            <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">
                ${p.observaciones || '—'}
            </td>
            <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
                ${p.registrado_por_usuario || '—'} •<br>
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
            const txt = `${p.nombre} ${p.curp || ''} ${p.telefono || ''} ${p.observaciones || ''} ${p.ejido_nombre || ''} ${p.predio_nombre || ''}`.toLowerCase();
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
        cuerpo.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data          = await fetchWithAuth('/productor/inactivos');
            _registrosInactivos = Array.isArray(data) ? data : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="9" class="text-center py-5 text-muted">
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
        <td class="px-3 text-muted" style="font-size:12px;letter-spacing:.05em;">
            ${p.curp || '—'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${p.telefono || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:13px;">
            ${p.ejido_nombre || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:13px;">
            ${p.predio_nombre || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">
            ${p.observaciones || '—'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
            ${p.registrado_por_usuario || '—'} •<br>
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
            const txt = `${p.nombre} ${p.curp || ''} ${p.telefono || ''} ${p.observaciones || ''} ${p.ejido_nombre || ''} ${p.predio_nombre || ''}`.toLowerCase();
            return !q || txt.includes(q);
        });
        const cuerpo = document.getElementById('prodBodyInactivos');
        if (!cuerpo) return;
        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosInactivos.length} registros`;
        cuerpo.innerHTML = filtrados.map((p, i) => `
    <tr>
        <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
        <td class="px-3">
            <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                ${p.nombre || '—'}
            </span>
        </td>
        <td class="px-3 text-muted" style="font-size:12px;letter-spacing:.05em;">
            ${p.curp || '—'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${p.telefono || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:13px;">
            ${p.ejido_nombre || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:13px;">
            ${p.predio_nombre || '—'}
        </td>
        <td class="px-3 text-muted" style="font-size:12px;max-width:260px;">
            ${p.observaciones || '—'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:12px;line-height:1.6;">
            ${p.registrado_por_usuario || '—'} •<br>
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
    // TOGGLE SECCIONES
    // ─────────────────────────────────────────
    window.toggleSeccionEjido = function () {
        const checked = document.getElementById('toggle_ejido').checked;
        document.getElementById('seccionEjido').classList.toggle('d-none', !checked);
        if (!checked) resetSeccionEjido();
    };

    window.toggleSeccionPredio = function () {
        const checked = document.getElementById('toggle_predio').checked;
        document.getElementById('seccionPredio').classList.toggle('d-none', !checked);
        if (!checked) resetSeccionPredio();
    };

    function resetSeccionEjido() {
        ['ej_nombre','ej_municipio','ej_estado_geo','ej_direccion'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('err_ej_nombre')?.classList.add('d-none');
    }

    function resetSeccionPredio() {
        document.getElementById('pr_nombre').value   = '';
        document.getElementById('pr_fk_ejido').value = '';
        document.getElementById('err_pr_nombre')?.classList.add('d-none');
    }

    function resetSecciones() {
        document.getElementById('toggle_ejido').checked  = false;
        document.getElementById('toggle_predio').checked = false;
        document.getElementById('seccionEjido').classList.add('d-none');
        document.getElementById('seccionPredio').classList.add('d-none');
        resetSeccionEjido();
        resetSeccionPredio();
    }

    // Cargar ejidos en el select del predio y productor
        async function cargarEjidosEnSelect() {
        try {
            const data = await fetchWithAuth('/ejido');
            const selects = ['f_fk_ejido', 'pr_fk_ejido'];
            selects.forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                sel.innerHTML = '<option value="">— Sin ejido —</option>' +
                    (Array.isArray(data) ? data : []).map(e =>
                        `<option value="${e.pk_ejido}">${e.nombre}</option>`
                    ).join('');
            });
        } catch (e) { console.error('Error cargar ejidos:', e); }
    }

    async function cargarPrediosEnSelect() {
        try {
            const data = await fetchWithAuth('/predio');
            const sel  = document.getElementById('f_fk_predio');
            if (!sel) return;
            sel.innerHTML = '<option value="">— Sin predio —</option>' +
                (Array.isArray(data) ? data : []).map(p =>
                    `<option value="${p.pk_predio}">${p.nombre}${p.ejido_nombre ? ' — ' + p.ejido_nombre : ''}</option>`
                ).join('');
        } catch (e) { console.error('Error cargar predios:', e); }
    }

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
        document.getElementById('f_curp').value        = '';
        document.getElementById('f_fk_ejido').value    = '';
        document.getElementById('f_fk_predio').value   = '';
        document.getElementById('err_curp').classList.add('d-none');
        document.getElementById('err_curp').textContent = 'Campo requerido';
        document.getElementById('err_nombre').textContent = 'Campo requerido';
        document.getElementById('err_telefono').classList.add('d-none');
        document.getElementById('err_telefono').textContent = 'Campo requerido';
        resetSecciones();
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
        document.getElementById('f_curp').value      = p.curp      || '';
        document.getElementById('f_fk_ejido').value  = p.fk_ejido  || '';
        document.getElementById('f_fk_predio').value = p.fk_predio || '';
        document.getElementById('err_curp').classList.add('d-none');
        document.getElementById('err_telefono').classList.add('d-none');
        document.getElementById('err_telefono').textContent = 'Campo requerido';
        resetSecciones();
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
        document.getElementById('f_curp').value        = '';
        document.getElementById('f_fk_ejido').value    = '';
        document.getElementById('f_fk_predio').value   = '';
        document.getElementById('err_curp').classList.add('d-none');
        document.getElementById('err_curp').textContent = 'Campo requerido';
        document.getElementById('err_nombre').textContent = 'Campo requerido';
        document.getElementById('err_telefono').classList.add('d-none');
        document.getElementById('err_telefono').textContent = 'Campo requerido';
        resetSecciones();
    };

    // ─────────────────────────────────────────
    // GUARDAR (CREAR O ACTUALIZAR)
    // ─────────────────────────────────────────
        window.guardarProductor = async function () {
        const id            = document.getElementById('f_pk_productor').value;
        const nombre        = document.getElementById('f_nombre').value.trim();
        const curp          = document.getElementById('f_curp').value.trim().toUpperCase();
        const telefono      = document.getElementById('f_telefono').value.trim();
        const observaciones = document.getElementById('f_observaciones').value.trim();
        const ejidoActivo   = document.getElementById('toggle_ejido').checked;
        const predioActivo  = document.getElementById('toggle_predio').checked;

        let valido = true;

        // Nombre
        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('err_nombre').textContent = 'Campo requerido';
            valido = false;
        } else {
            const errores = validarFormato(nombre);
            if (errores.length) {
                document.getElementById('err_nombre').classList.remove('d-none');
                document.getElementById('err_nombre').textContent = errores[0];
                valido = false;
            } else {
                document.getElementById('err_nombre').classList.add('d-none');
            }
        }

        // CURP
        if (!curp) {
            document.getElementById('err_curp').classList.remove('d-none');
            document.getElementById('err_curp').textContent = 'Campo requerido';
            valido = false;
        } else if (curp.length !== 18) {
            document.getElementById('err_curp').classList.remove('d-none');
            document.getElementById('err_curp').textContent = 'La CURP debe tener 18 caracteres';
            valido = false;
        } else {
            document.getElementById('err_curp').classList.add('d-none');
        }

        // TELÉFONO (opcional pero si se llena debe tener 10 dígitos)
        if (telefono && telefono.replace(/\D/g, '').length < 10) {
            document.getElementById('err_telefono').textContent = 'El teléfono debe tener 10 dígitos';
            document.getElementById('err_telefono').classList.remove('d-none');
            valido = false;
        } else {
            document.getElementById('err_telefono').classList.add('d-none');
        }

        // Validar ejido si está activo
        if (ejidoActivo) {
            const ejNombre = document.getElementById('ej_nombre').value.trim();
            if (!ejNombre) {
                document.getElementById('err_ej_nombre').classList.remove('d-none');
                document.getElementById('err_ej_nombre').textContent = 'Campo requerido';
                valido = false;
            } else {
                const errEj = validarFormato(ejNombre);
                if (errEj.length) {
                    document.getElementById('err_ej_nombre').classList.remove('d-none');
                    document.getElementById('err_ej_nombre').textContent = errEj[0];
                    valido = false;
                } else {
                    document.getElementById('err_ej_nombre').classList.add('d-none');
                }
            }
        }

        // Validar predio si está activo
        if (predioActivo) {
            const prNombre = document.getElementById('pr_nombre').value.trim();
            if (!prNombre) {
                document.getElementById('err_pr_nombre').classList.remove('d-none');
                document.getElementById('err_pr_nombre').textContent = 'Campo requerido';
                valido = false;
            } else {
                const errPr = validarFormato(prNombre);
                if (errPr.length) {
                    document.getElementById('err_pr_nombre').classList.remove('d-none');
                    document.getElementById('err_pr_nombre').textContent = errPr[0];
                    valido = false;
                } else {
                    document.getElementById('err_pr_nombre').classList.add('d-none');
                }
            }
        }

        if (!valido) return;

        try {
            // 1. Guardar ejido si aplica
            let nuevoEjidoId = document.getElementById('f_fk_ejido').value || null;
            if (ejidoActivo && !id) {
                try {
                    const ejRes = await fetchWithAuth('/ejido', 'POST', {
                        nombre:     document.getElementById('ej_nombre').value.trim(),
                        municipio:  document.getElementById('ej_municipio').value.trim()  || null,
                        estado_geo: document.getElementById('ej_estado_geo').value.trim() || null,
                        direccion:  document.getElementById('ej_direccion').value.trim()  || null
                    });
                    nuevoEjidoId = ejRes.data?.pk_ejido || null;
                    await cargarEjidosEnSelect();
                } catch (e) { console.warn('Ejido no guardado:', e.error || e.message); }
            }

            // 2. Guardar predio si aplica
            let nuevoPredioId = document.getElementById('f_fk_predio').value || null;
            if (predioActivo && !id) {
                try {
                    const ejidoParaPredio = nuevoEjidoId || document.getElementById('pr_fk_ejido').value || null;
                    const prRes = await fetchWithAuth('/predio', 'POST', {
                        nombre:   document.getElementById('pr_nombre').value.trim(),
                        fk_ejido: ejidoParaPredio
                    });
                    nuevoPredioId = prRes.data?.pk_predio || null;
                    await cargarPrediosEnSelect();
                } catch (e) { console.warn('Predio no guardado:', e.error || e.message); }
            }

            // 3. Guardar productor con los IDs correctos
            const payload = {
                nombre,
                curp,
                telefono:      telefono      || null,
                observaciones: observaciones || null,
                fk_ejido:      nuevoEjidoId,
                fk_predio:     nuevoPredioId
            };

            if (id) {
                await fetchWithAuth(`/productor/${id}`, 'PUT', payload);
            } else {
                await fetchWithAuth('/productor', 'POST', payload);
            }

            Swal.fire({
                icon: 'success',
                title: id ? 'Actualizado' : 'Registrado',
                text: id ? 'Productor actualizado exitosamente' : 'Productor creado exitosamente',
                timer: 2000,
                showConfirmButton: false
            });

            cancelarFormulario();
            listar();

        } catch (error) {
            const msg = error.error || error.message || '';
            if (msg.includes('CURP') || msg.includes('curp')) {
                document.getElementById('err_curp').classList.remove('d-none');
                document.getElementById('err_curp').textContent = msg;
            } else if (msg.includes('nombre')) {
                document.getElementById('err_nombre').classList.remove('d-none');
                document.getElementById('err_nombre').textContent = msg;
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: msg });
            }
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