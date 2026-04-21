(function () {
    let _registrosActivos = [];
    let _registrosBajas   = [];
    let _idParaBaja       = null;
    let _archivoBaja      = null;
    let _wPasoActual      = 1;
    let _wFotoFile        = null;

    esperarElemento('vehBody', async () => {
        await Promise.all([
            cargarTipos(),
            cargarUbicaciones(),
            cargarFacturas(),
            cargarGarantias()
        ]);
        listar();
    });

    // ─────────────────────────────────────────
    // CARGAR CATÁLOGOS
    // ─────────────────────────────────────────
    async function cargarTipos() {
        try {
            const data = await fetchWithAuth('/tipo-equipo');
            const sel  = document.getElementById('w_fk_tipo');
            data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.pk_tipo_equipo;
                opt.textContent = t.nombre;
                sel.appendChild(opt);
            });
        } catch(e) { console.error('Error tipos:', e); }
    }

    async function cargarUbicaciones() {
        try {
            const data = await fetchWithAuth('/ubicacion');
            const sel  = document.getElementById('w_fk_ubicacion');
            data.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.pk_ubicacion;
                opt.textContent = u.nombre;
                sel.appendChild(opt);
            });
        } catch(e) { console.error('Error ubicaciones:', e); }
    }

    async function cargarFacturas() {
        try {
            const data = await fetchWithAuth('/factura');
            const sel  = document.getElementById('w_fk_factura');
            data.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.pk_factura;
                opt.textContent = `${f.numero_factura}${f.proveedor_nombre ? ' — '+f.proveedor_nombre : ''}`;
                sel.appendChild(opt);
            });
        } catch(e) { console.error('Error facturas:', e); }
    }

    async function cargarGarantias() {
        try {
            const data = await fetchWithAuth('/garantia');
            const sel  = document.getElementById('w_fk_garantia');
            data.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.pk_garantia;
                opt.textContent = `Garantía #${g.pk_garantia} — ${g.fecha_inicio ? g.fecha_inicio.split('T')[0] : ''}`;
                sel.appendChild(opt);
            });
        } catch(e) { console.error('Error garantías:', e); }
    }

    // ─────────────────────────────────────────
    // WIZARD
    // ─────────────────────────────────────────
    window.wPrevisualizarFoto = function(input) {
        const file = input.files[0];
        if (!file) return;
        _wFotoFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('wFotoPreview').innerHTML =
                `<img src="${e.target.result}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        };
        reader.readAsDataURL(file);
    };

    window.abrirWizard = function() {
        _wFotoFile = null;
        document.getElementById('w_pk_vehiculo').value = '';
        document.getElementById('wizardTitulo').textContent = 'Registrar Vehículo';

        // --- Paso 1 ---
        ['w_numero_economico', 'w_numero_inventario_gob'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('w_fk_tipo').value = '';

        // --- Paso 2 (incluye color, vin, placas) ---
        ['w_marca', 'w_modelo', 'w_anio', 'w_color', 'w_vin', 'w_placas'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('w_estado_fisico').value    = 'bueno';
        document.getElementById('w_estado_operativo').value = 'disponible';
        document.getElementById('w_fk_ubicacion').value     = '';

        // --- Paso 3 ---
        document.getElementById('w_kilometraje_actual').value = 0;
        document.getElementById('w_gasolina_litros').value    = 0;
        document.getElementById('w_fk_factura').value         = '';
        document.getElementById('w_fk_garantia').value        = '';

        document.getElementById('wFotoPreview').innerHTML =
            `<i class="fa-solid fa-camera" style="color:#3b82f6;font-size:16px;"></i>
             <span style="font-size:9px;color:#3b82f6;">Foto</span>`;
        wIrPaso(1);
        new bootstrap.Modal(document.getElementById('modalWizard')).show();
    };

    window.editarVehiculo = function(id) {
        const v = _registrosActivos.find(x => x.pk_vehiculo === id);
        if (!v) return;
        _wFotoFile = null;
        document.getElementById('w_pk_vehiculo').value           = v.pk_vehiculo;
        document.getElementById('wizardTitulo').textContent      = `Editando: ${v.numero_economico}`;

        // --- Paso 1 ---
        document.getElementById('w_numero_economico').value      = v.numero_economico || '';
        document.getElementById('w_numero_inventario_gob').value = v.numero_inventario_gob || '';

        // --- Paso 2 (incluye color, vin, placas) ---
        document.getElementById('w_marca').value                 = v.marca   || '';
        document.getElementById('w_modelo').value                = v.modelo  || '';
        document.getElementById('w_anio').value                  = v.anio    || '';
        document.getElementById('w_color').value                 = v.color   || '';
        document.getElementById('w_vin').value                   = v.vin     || '';
        document.getElementById('w_placas').value                = v.placas  || '';
        document.getElementById('w_estado_fisico').value         = v.estado_fisico    || 'bueno';
        document.getElementById('w_estado_operativo').value      = v.estado_operativo || 'disponible';

        // --- Paso 3 ---
        document.getElementById('w_kilometraje_actual').value    = v.kilometraje_actual || 0;
        document.getElementById('w_gasolina_litros').value       = v.gasolina_litros    || 0;

        if (v.foto_vehiculo) {
            document.getElementById('wFotoPreview').innerHTML =
                `<img src="${v.foto_vehiculo}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            document.getElementById('wFotoPreview').innerHTML =
                `<i class="fa-solid fa-camera" style="color:#3b82f6;font-size:16px;"></i>
                 <span style="font-size:9px;color:#3b82f6;">Foto</span>`;
        }

        setTimeout(() => {
            document.getElementById('w_fk_tipo').value      = v.fk_tipo      || '';
            document.getElementById('w_fk_ubicacion').value = v.fk_ubicacion || '';
            document.getElementById('w_fk_factura').value   = v.fk_factura   || '';
            document.getElementById('w_fk_garantia').value  = v.fk_garantia  || '';
        }, 50);

        wIrPaso(1);
        new bootstrap.Modal(document.getElementById('modalWizard')).show();
    };

    window.cerrarWizard = function() {
        bootstrap.Modal.getInstance(document.getElementById('modalWizard'))?.hide();
    };

    function wIrPaso(paso) {
        _wPasoActual = paso;
        [1,2,3].forEach(p => {
            document.getElementById(`wPaso${p}`).classList.add('d-none');
        });
        document.getElementById(`wPaso${paso}`).classList.remove('d-none');
        [1,2,3].forEach(p => {
            const circle = document.getElementById(`wCircle${p}`);
            const label  = document.getElementById(`wLabel${p}`);
            const line   = document.getElementById(`wLine${p}`);
            if (p < paso) {
                circle.style.background = '#16a34a';
                circle.style.color      = '#fff';
                circle.textContent      = '✓';
                if (label) label.style.color = '#16a34a';
                if (line)  line.style.background = '#16a34a';
            } else if (p === paso) {
                circle.style.background = '#1a3c5e';
                circle.style.color      = '#fff';
                circle.textContent      = p;
                if (label) label.style.color = '#1a3c5e';
            } else {
                circle.style.background = '#e2e8f0';
                circle.style.color      = '#94a3b8';
                circle.textContent      = p;
                if (label) label.style.color = '#94a3b8';
                if (line)  line.style.background = '#e2e8f0';
            }
        });
        document.getElementById('wPasoLabel').textContent = `Paso ${paso} de 3`;
        document.getElementById('wBtnAtras').style.display = paso > 1 ? '' : 'none';
        document.getElementById('wBtnSiguiente').classList.toggle('d-none', paso === 3);
        document.getElementById('wBtnGuardar').classList.toggle('d-none', paso !== 3);
    }

    window.wSiguiente = function() {
        if (_wPasoActual === 1) {
            const num  = document.getElementById('w_numero_economico').value.trim();
            const tipo = document.getElementById('w_fk_tipo').value;
            if (!num || !tipo) {
                Swal.fire({ icon:'warning', title:'Campos requeridos',
                    text:'Número económico y tipo de vehículo son obligatorios' });
                return;
            }
        }
        if (_wPasoActual === 2) {
            const ubic = document.getElementById('w_fk_ubicacion').value;
            if (!ubic) {
                Swal.fire({ icon:'warning', title:'Campo requerido',
                    text:'Selecciona una ubicación' });
                return;
            }
        }
        if (_wPasoActual < 3) wIrPaso(_wPasoActual + 1);
    };

    window.wAtras = function() {
        if (_wPasoActual > 1) wIrPaso(_wPasoActual - 1);
    };

    window.wGuardar = async function() {
        const id   = document.getElementById('w_pk_vehiculo').value;

        // ── NUEVO: subir foto a Cloudinary antes del POST/PUT ──
        let foto_vehiculo = null;
        if (_wFotoFile) {
            try {
                const formData = new FormData();
                formData.append('archivo', _wFotoFile);
                const resF = await fetch('/archivo/temporal', {
                    method:  'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body:    formData
                });
                const dataF = await resF.json();
                if (dataF.url) foto_vehiculo = dataF.url;
            } catch(ef) { console.warn('Foto no subida:', ef); }
        }
        // ──────────────────────────────────────────────────────

        const data = {
            numero_economico:      document.getElementById('w_numero_economico').value.trim(),
            numero_inventario_gob: document.getElementById('w_numero_inventario_gob').value.trim() || null,
            fk_tipo:               document.getElementById('w_fk_tipo').value,
            marca:                 document.getElementById('w_marca').value.trim()   || null,
            modelo:                document.getElementById('w_modelo').value.trim()  || null,
            anio:                  document.getElementById('w_anio').value            || null,
            // ── CAMPOS CORREGIDOS ──
            color:                 document.getElementById('w_color').value.trim()   || null,
            vin:                   document.getElementById('w_vin').value.trim()     || null,
            placas:                document.getElementById('w_placas').value.trim()  || null,
            // ──────────────────────
            estado_fisico:         document.getElementById('w_estado_fisico').value,
            estado_operativo:      document.getElementById('w_estado_operativo').value,
            fk_ubicacion:          document.getElementById('w_fk_ubicacion').value,
            kilometraje_actual:    document.getElementById('w_kilometraje_actual').value || 0,
            gasolina_litros:       document.getElementById('w_gasolina_litros').value    || 0,
            fk_factura:            document.getElementById('w_fk_factura').value  || null,
            fk_garantia:           document.getElementById('w_fk_garantia').value || null,
            // ── NUEVO: incluir URL en el body ──
            ...(foto_vehiculo && { foto_vehiculo }),
            // ──────────────────────────────────
        };
        try {
            if (id) {
                await fetchWithAuth(`/vehiculo/${id}`, 'PUT', data);
                Swal.fire({ icon:'success', title:'Actualizado',
                    text:'Vehículo actualizado exitosamente',
                    timer:2000, showConfirmButton:false });
            } else {
                await fetchWithAuth('/vehiculo', 'POST', data);
                Swal.fire({ icon:'success', title:'Registrado',
                    text:'Vehículo creado exitosamente',
                    timer:2000, showConfirmButton:false });
            }
            cerrarWizard();
            listar();
        } catch(error) {
            const msg = error.message.includes('duplicate key')
                ? 'El número económico ya existe, usa uno diferente'
                : error.message;
            Swal.fire({ icon:'error', title:'Error', text: msg });
        }
    };

    // ─────────────────────────────────────────
    // LISTAR ACTIVOS
    // ─────────────────────────────────────────
    async function listar() {
        const tabla = document.getElementById('vehBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/vehiculo');
            _registrosActivos = Array.isArray(data) ? data : [];
            const badge       = document.getElementById('badgeActivos');
            if (badge) badge.textContent = _registrosActivos.length;
            renderTabla(_registrosActivos);
        } catch(e) {
            console.error('Error listar:', e);
            Swal.fire({ icon:'error', title:'Error', text:'No se pudo cargar los vehículos' });
        }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('vehBody');
        const footer = document.getElementById('footerInfo');
        const info   = document.getElementById('info-registros');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="13" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-truck fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay vehículos registrados
                </td></tr>`;
            if (footer) footer.textContent = '';
            if (info)   info.textContent   = 'Sin registros';
            initPaginacion({ tbodyId: 'vehBody', filasPorPagina: 10 });
            return;
        }

        if (footer) footer.textContent = '';
        if (info)   info.textContent   = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((v, i) => `
            <tr>
                <td class="px-2 text-center">
                    ${v.foto_vehiculo
                        ? `<img src="${v.foto_vehiculo}"
                                style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
                        : `<div style="width:36px;height:36px;border-radius:50%;background:#e2e8f0;
                                       display:flex;align-items:center;justify-content:center;
                                       font-size:12px;color:#64748b;">
                               <i class="fa-solid fa-image"></i>
                           </div>`
                    }
                </td>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i+1}</td>
                <td class="px-3">
                    <span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">
                        ${v.numero_economico||'—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${v.numero_inventario_gob||'—'}
                </td>
                <td class="px-3" style="font-size:13px;">
                    <div class="fw-semibold" style="color:#1a3c5e;font-size:12px;">
                        ${v.tipo_nombre||'—'}
                    </div>
                    <div class="text-muted" style="font-size:11px;">
                        ${[v.marca, v.modelo ? '· '+v.modelo : '', v.anio ? '· '+v.anio : '']
                            .filter(Boolean).join(' ')}
                    </div>
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${v.vin||'—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${v.placas||'—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${v.fecha_factura
                        ? new Date(v.fecha_factura).toLocaleDateString('es-MX')
                        : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${v.numero_factura||'—'}
                </td>
                <td class="px-3 text-center">${badgeFisico(v.estado_fisico)}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${v.ubicacion_nombre||'—'}</td>
                <td class="px-3 text-center">${badgeOperativo(v.estado_operativo)}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalle(${v.pk_vehiculo})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarVehiculo(${v.pk_vehiculo})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="abrirBaja(${v.pk_vehiculo},
                            '${v.numero_economico}',
                            '${(v.tipo_nombre||'').replace(/'/g,"\\'")}',
                            '${(v.marca||'').replace(/'/g,"\\'")}',
                            '${(v.modelo||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'vehBody', filasPorPagina: 10 });
    }

    // ─────────────────────────────────────────
    // BADGES
    // ─────────────────────────────────────────
    function badgeFisico(estado) {
        const map = {
            bueno:   ['bg-success',          'Bueno'],
            regular: ['bg-warning text-dark', 'Regular'],
            malo:    ['bg-danger',            'Malo']
        };
        const [cls, lbl] = map[estado] || ['bg-secondary', estado||'—'];
        return `<span class="badge ${cls}" style="font-size:11px;">${lbl}</span>`;
    }

    function badgeOperativo(estado) {
        const map = {
            disponible:    ['bg-success',        'Disponible'],
            prestada:      ['bg-info text-dark',  'Prestada'],
            mantenimiento: ['bg-danger',          'Mantenimiento'],
            baja:          ['bg-dark',            'Baja']
        };
        const [cls, lbl] = map[estado] || ['bg-secondary', estado||'—'];
        return `<span class="badge ${cls}" style="font-size:11px;">${lbl}</span>`;
    }

    // ─────────────────────────────────────────
    // FILTRAR ACTIVOS
    // ─────────────────────────────────────────
    window.filtrarTabla = function() {
        const q      = (document.getElementById('searchInput')?.value||'').toLowerCase();
        const estado = document.getElementById('filtroEstado')?.value||'';
        renderTabla(_registrosActivos.filter(v => {
            const txt = `${v.numero_economico} ${v.numero_inventario_gob} ${v.tipo_nombre} ${v.marca} ${v.modelo} ${v.vin} ${v.placas}`.toLowerCase();
            return (!q || txt.includes(q)) && (!estado || v.estado_operativo === estado);
        }));
    };

    // ─────────────────────────────────────────
    // TABS
    // ─────────────────────────────────────────
    window.switchTab = function(tab) {
        const va = document.getElementById('vistaActivos');
        const vb = document.getElementById('vistaBajas');
        const ta = document.getElementById('tabActivos');
        const tb = document.getElementById('tabBajas');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vb.classList.add('d-none');
            ta.classList.add('active');    tb.classList.remove('active');
        } else {
            va.classList.add('d-none');    vb.classList.remove('d-none');
            ta.classList.remove('active'); tb.classList.add('active');
            listarBajas();
        }
    };

    // ─────────────────────────────────────────
    // LISTAR BAJAS
    // ─────────────────────────────────────────
    async function listarBajas() {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;
        cuerpo.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data = await fetchWithAuth('/vehiculo/bajas/registradas');
            _registrosBajas = Array.isArray(data) ? data : [];
            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = _registrosBajas.length;
            renderTablaBajas(_registrosBajas);
        } catch(e) { console.error('Error bajas:', e); }
    }

    window.filtrarBajas = function() {
        const q    = (document.getElementById('searchBajas')?.value||'').toLowerCase();
        const tipo = document.getElementById('filtroTipoBaja')?.value||'';
        renderTablaBajas(_registrosBajas.filter(b => {
            const txt = `${b.numero_economico} ${b.tipo_nombre} ${b.marca} ${b.modelo} ${b.motivo}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || b.tipo_baja === tipo);
        }));
    };

    function renderTablaBajas(data) {
        const cuerpo = document.getElementById('bajasBody');
        const info   = document.getElementById('info-registros-bajas');

        if (!data.length) {
            cuerpo.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay vehículos dados de baja
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'bajasBody', filasPorPagina: 10, sufijo: 'bajas' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosBajas.length} registros`;

        cuerpo.innerHTML = data.map((b, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i+1}</td>
                <td class="px-3">
                    <span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">
                        ${b.numero_economico||'—'}
                    </span>
                </td>
                <td class="px-3" style="font-size:13px;">${b.tipo_nombre||'—'}</td>
                <td class="px-3" style="font-size:13px;">
                    ${b.marca||'—'}
                    <span class="text-muted">${b.modelo ? ' · '+b.modelo : ''}</span>
                </td>
                <td class="px-3 text-center">
                    <span class="badge bg-dark" style="font-size:11px;">${b.tipo_baja||'—'}</span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;max-width:200px;">${b.motivo||'—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${b.autorizado_por||'—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${b.fecha_baja ? new Date(b.fecha_baja).toLocaleDateString('es-MX') : '—'}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'bajasBody', filasPorPagina: 10, sufijo: 'bajas' });
    }

   // ─────────────────────────────────────────
// VER DETALLE
// ─────────────────────────────────────────
window.verDetalle = async function(id) {
    document.getElementById('detalleTitle').textContent = 'Cargando…';
    document.getElementById('detalleBody').innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border" style="color:#1a3c5e;" role="status"></div>
        </div>`;
    new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    try {
        const v = await fetchWithAuth(`/vehiculo/${id}`);
        document.getElementById('detalleTitle').textContent =
            `${v.numero_economico} — ${v.tipo_nombre||''}`;
        document.getElementById('detalleBody').innerHTML = `
            ${v.foto_vehiculo ? `
            <div class="text-center mb-3">
                <a href="${v.foto_vehiculo}" target="_blank" title="Ver foto completa">
                    <img src="${v.foto_vehiculo}"
                        style="width:90px;height:90px;border-radius:50%;object-fit:cover;
                            border:3px solid #1a3c5e;cursor:pointer;
                            transition:opacity .2s;"
                        onmouseover="this.style.opacity='.8'"
                        onmouseout="this.style.opacity='1'">
                </a>
            </div>` : ''}
            <div class="row g-3">
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">N° ECONÓMICO</p>
                    <p class="fw-bold mb-0" style="font-family:monospace;color:#1a3c5e;">
                        ${v.numero_economico||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">N° INVENTARIO GOB</p>
                    <p class="mb-0">${v.numero_inventario_gob||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">TIPO</p>
                    <p class="mb-0">${v.tipo_nombre||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">MARCA</p>
                    <p class="mb-0">${v.marca||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">MODELO</p>
                    <p class="mb-0">${v.modelo||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">AÑO</p>
                    <p class="mb-0">${v.anio||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">COLOR</p>
                    <p class="mb-0">${v.color||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">VIN</p>
                    <p class="mb-0" style="font-family:monospace;">${v.vin||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">PLACAS</p>
                    <p class="mb-0">${v.placas||'—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="text-muted mb-1" style="font-size:11px;">UBICACIÓN</p>
                    <p class="mb-0">${v.ubicacion_nombre||'—'}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted mb-1" style="font-size:11px;">KILOMETRAJE</p>
                    <p class="mb-0">${v.kilometraje_actual ?? '—'} km</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted mb-1" style="font-size:11px;">GASOLINA (L)</p>
                    <p class="mb-0">${v.gasolina_litros ?? '—'}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted mb-1" style="font-size:11px;">ESTADO FÍSICO</p>
                    <p class="mb-0">${badgeFisico(v.estado_fisico)}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted mb-1" style="font-size:11px;">ESTADO OPERATIVO</p>
                    <p class="mb-0">${badgeOperativo(v.estado_operativo)}</p>
                </div>
               ${v.numero_factura ? `
                <div class="col-md-6">
                    <p class="text-muted mb-1" style="font-size:11px;">FACTURA</p>
                    <p class="mb-0">${v.numero_factura}
                        ${v.fecha_factura
                            ? ` — ${new Date(v.fecha_factura).toLocaleDateString('es-MX')}`
                            : ''}
                        ${v.costo_adquisicion
                            ? ` — $${parseFloat(v.costo_adquisicion).toLocaleString('es-MX')}`
                            : ''}
                        ${v.pdf_factura
                            ? `<a href="${v.pdf_factura}" target="_blank" class="ms-2 btn btn-sm btn-outline-danger py-0">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                               </a>`
                            : ''}
                    </p>
                </div>` : ''}
                ${v.fecha_inicio ? `
                <div class="col-md-6">
                    <p class="text-muted mb-1" style="font-size:11px;">GARANTÍA</p>
                    <p class="mb-0">
                        ${v.garantia_folio ? `<span class="fw-semibold">${v.garantia_folio}</span> — ` : ''}
                        ${v.fecha_inicio.split('T')[0]}
                        ${v.fecha_fin ? ' → '+v.fecha_fin.split('T')[0] : ''}
                        ${v.garantia_pdf
                            ? `<a href="${v.garantia_pdf}" target="_blank" class="ms-2 btn btn-sm btn-outline-danger py-0">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                               </a>`
                            : ''}
                    </p>
                </div>` : ''}
                <div class="col-12">
                    <p class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</p>
                    <p class="mb-0">${v.registrado_por_usuario||'—'}
                        <span class="text-muted ms-2" style="font-size:11px;">
                            ${v.fecha_registro
                                ? new Date(v.fecha_registro).toLocaleDateString('es-MX') : ''}
                        </span>
                    </p>
                </div>
            </div>`;
    } catch(e) {
        document.getElementById('detalleBody').innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="fa-solid fa-triangle-exclamation me-1"></i>
                Error al cargar el detalle
            </div>`;
    }
};

    // ─────────────────────────────────────────
    // BAJA
    // ─────────────────────────────────────────
    window.previsualizarDocBaja = function(input) {
        const file = input.files[0];
        if (!file) { _archivoBaja = null; return; }
        _archivoBaja = file;
        const label = document.getElementById('docBajaLabel');
        if (label) label.textContent = file.name;
    };

    window.abrirBaja = function(id, numero, tipo, marca, modelo) {
        _idParaBaja  = id;
        _archivoBaja = null;
        document.getElementById('bajaNumero').textContent       = numero;
        document.getElementById('bajaVehiculoDesc').textContent = `${tipo} · ${marca} ${modelo}`.trim();
        document.getElementById('bajaTipoInput').value          = '';
        document.getElementById('bajaMotivoInput').value        = '';
        document.getElementById('bajaAutorizadoInput').value    = '';
        document.getElementById('bajaDocInput').value           = '';
        document.getElementById('docBajaLabel').textContent     = 'Sin documento seleccionado';
        document.getElementById('err_baja_tipo').classList.add('d-none');
        document.getElementById('err_baja_motivo').classList.add('d-none');
        new bootstrap.Modal(document.getElementById('modalBaja')).show();
    };

    window.confirmarBajaModal = async function() {
        const tipo       = document.getElementById('bajaTipoInput').value;
        const motivo     = document.getElementById('bajaMotivoInput').value.trim();
        const autorizado = document.getElementById('bajaAutorizadoInput').value.trim();
        let valido       = true;
        if (!tipo)   { document.getElementById('err_baja_tipo').classList.remove('d-none');   valido = false; }
        if (!motivo) { document.getElementById('err_baja_motivo').classList.remove('d-none'); valido = false; }
        if (!valido) return;

        try {
            await fetchWithAuth(`/vehiculo/${_idParaBaja}/desactivar`, 'PATCH');

            let urlDocumento = null;
            if (_archivoBaja) {
                try {
                    const formData = new FormData();
                    formData.append('archivo',     _archivoBaja);
                    formData.append('modulo',      'vehiculo');
                    formData.append('fk_registro', _idParaBaja);
                    formData.append('categoria',   'documento_baja');
                    const resFile  = await fetch('/archivo', {
                        method:  'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body:    formData
                    });
                    const dataFile = await resFile.json();
                    if (dataFile.url) urlDocumento = dataFile.url;
                } catch(ef) { console.warn('Documento no subido:', ef); }
            }

            await fetchWithAuth('/vehiculo/bajas', 'POST', {
                fk_vehiculo:        _idParaBaja,
                tipo_baja:          tipo,
                motivo,
                documento_respaldo: urlDocumento,
                autorizado_por:     autorizado || null
            });

            bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
            Swal.fire({ icon:'success', title:'Baja registrada',
                text:'El vehículo fue dado de baja exitosamente',
                timer:2000, showConfirmButton:false });
            listar();
        } catch(error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

})();