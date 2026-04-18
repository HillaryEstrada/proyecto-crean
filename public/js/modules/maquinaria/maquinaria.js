(function () {

    let _registrosActivos = [];
    let _registrosBajas   = [];
    let _idParaBaja       = null;
    let _archivoBaja      = null;
    let _wPasoActual      = 1;
    let _wFotoFile        = null;

    esperarElemento('maqBody', async () => {
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
        document.getElementById('w_pk_maquinaria').value = '';
        document.getElementById('wizardTitulo').textContent = 'Registrar Maquinaria';
        ['w_numero_economico','w_numero_inventario_seder','w_descripcion',
         'w_marca','w_modelo','w_anio','w_color','w_serie','w_numero_motor'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('w_horas_actuales').value     = 0;
        document.getElementById('w_combustible_litros').value = 0;
        document.getElementById('w_estado_fisico').value      = 'bueno';
        document.getElementById('w_estado_operativo').value   = 'disponible';
        document.getElementById('w_fk_tipo').value            = '';
        document.getElementById('w_fk_ubicacion').value       = '';
        document.getElementById('w_fk_factura').value         = '';
        document.getElementById('w_fk_garantia').value        = '';
        document.getElementById('wFotoPreview').innerHTML =
            `<i class="fa-solid fa-camera" style="color:#3b82f6;font-size:16px;"></i>
             <span style="font-size:9px;color:#3b82f6;">Foto</span>`;
        wIrPaso(1);
        new bootstrap.Modal(document.getElementById('modalWizard')).show();
    };

    window.editarMaquinaria = function(id) {
        const m = _registrosActivos.find(x => x.pk_maquinaria === id);
        if (!m) return;
        _wFotoFile = null;
        document.getElementById('w_pk_maquinaria').value           = m.pk_maquinaria;
        document.getElementById('wizardTitulo').textContent        = `Editando: ${m.numero_economico}`;
        document.getElementById('w_numero_economico').value        = m.numero_economico||'';
        document.getElementById('w_numero_inventario_seder').value = m.numero_inventario_seder||'';
        document.getElementById('w_descripcion').value             = m.descripcion||'';
        document.getElementById('w_marca').value                   = m.marca||'';
        document.getElementById('w_modelo').value                  = m.modelo||'';
        document.getElementById('w_anio').value                    = m.anio||'';
        document.getElementById('w_color').value                   = m.color||'';
        document.getElementById('w_serie').value                   = m.serie||'';
        document.getElementById('w_numero_motor').value            = m.numero_motor||'';
        document.getElementById('w_horas_actuales').value          = m.horas_actuales||0;
        document.getElementById('w_combustible_litros').value      = m.combustible_litros||0;
        document.getElementById('w_estado_fisico').value           = m.estado_fisico||'bueno';
        document.getElementById('w_estado_operativo').value        = m.estado_operativo||'disponible';
        if (m.foto_maquina) {
            document.getElementById('wFotoPreview').innerHTML =
                `<img src="${m.foto_maquina}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            document.getElementById('wFotoPreview').innerHTML =
                `<i class="fa-solid fa-camera" style="color:#3b82f6;font-size:16px;"></i>
                 <span style="font-size:9px;color:#3b82f6;">Foto</span>`;
        }
        setTimeout(() => {
            document.getElementById('w_fk_tipo').value      = m.fk_tipo||'';
            document.getElementById('w_fk_ubicacion').value = m.fk_ubicacion||'';
            document.getElementById('w_fk_factura').value   = m.fk_factura||'';
            document.getElementById('w_fk_garantia').value  = m.fk_garantia||'';
        }, 50);
        wIrPaso(1);
        new bootstrap.Modal(document.getElementById('modalWizard')).show();
    };

    window.cerrarWizard = function() {
        bootstrap.Modal.getInstance(document.getElementById('modalWizard'))?.hide();
    };

    function wIrPaso(paso) {
        _wPasoActual = paso;
        [1,2,3,4].forEach(p => {
            document.getElementById(`wPaso${p}`).classList.add('d-none');
        });
        document.getElementById(`wPaso${paso}`).classList.remove('d-none');
        [1,2,3,4].forEach(p => {
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
        document.getElementById('wPasoLabel').textContent = `Paso ${paso} de 4`;
        document.getElementById('wBtnAtras').style.display = paso > 1 ? '' : 'none';
        document.getElementById('wBtnSiguiente').classList.toggle('d-none', paso === 4);
        document.getElementById('wBtnGuardar').classList.toggle('d-none', paso !== 4);
    }

    window.wSiguiente = function() {
        if (_wPasoActual === 1) {
            const num  = document.getElementById('w_numero_economico').value.trim();
            const tipo = document.getElementById('w_fk_tipo').value;
            if (!num || !tipo) {
                Swal.fire({ icon:'warning', title:'Campos requeridos',
                    text:'Número económico y tipo de equipo son obligatorios' });
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
        if (_wPasoActual < 4) wIrPaso(_wPasoActual + 1);
    };

    window.wAtras = function() {
        if (_wPasoActual > 1) wIrPaso(_wPasoActual - 1);
    };

   window.wGuardar = async function() {
        const id   = document.getElementById('w_pk_maquinaria').value;

        try {
            // Subir foto primero si hay una nueva
            let foto_maquina = null;
            if (_wFotoFile) {
                const formData = new FormData();
                formData.append('archivo', _wFotoFile);
                const res = await fetch('/archivo/temporal', {
                    method:  'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body:    formData
                });
                if (!res.ok) throw new Error('Error al subir la foto');
                const resData = await res.json();
                foto_maquina = resData.url;
            }

        const data = {
            numero_economico:        document.getElementById('w_numero_economico').value.trim(),
            numero_inventario_seder: document.getElementById('w_numero_inventario_seder').value.trim() || null,
            fk_tipo:                 document.getElementById('w_fk_tipo').value,
            descripcion:             document.getElementById('w_descripcion').value.trim() || null,
            marca:                   document.getElementById('w_marca').value.trim() || null,
            modelo:                  document.getElementById('w_modelo').value.trim() || null,
            anio:                    document.getElementById('w_anio').value || null,
            color:                   document.getElementById('w_color').value.trim() || null,
            serie:                   document.getElementById('w_serie').value.trim() || null,
            numero_motor:            document.getElementById('w_numero_motor').value.trim() || null,
            estado_fisico:           document.getElementById('w_estado_fisico').value,
            estado_operativo:        document.getElementById('w_estado_operativo').value,
            fk_ubicacion:            document.getElementById('w_fk_ubicacion').value,
            horas_actuales:          document.getElementById('w_horas_actuales').value || 0,
            combustible_litros:      document.getElementById('w_combustible_litros').value || 0,
            fk_factura:              document.getElementById('w_fk_factura').value || null,
            fk_garantia:             document.getElementById('w_fk_garantia').value || null,
        };

            // Agregar foto al payload solo si se subió una nueva
            if (foto_maquina) {
                data.foto_maquina = foto_maquina;
            }

            if (id) {
                await fetchWithAuth(`/maquinaria/${id}`, 'PUT', data);
                Swal.fire({ icon:'success', title:'Actualizado',
                    text:'Maquinaria actualizada exitosamente',
                    timer:2000, showConfirmButton:false });
            } else {
                await fetchWithAuth('/maquinaria', 'POST', data);
                Swal.fire({ icon:'success', title:'Registrado',
                    text:'Maquinaria creada exitosamente',
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
        const tabla = document.getElementById('maqBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/maquinaria');
            _registrosActivos = Array.isArray(data) ? data : [];
            const badge       = document.getElementById('badgeActivos');
            if (badge) badge.textContent = _registrosActivos.length;
            renderTabla(_registrosActivos);
        } catch(e) {
            console.error('Error listar:', e);
            Swal.fire({ icon:'error', title:'Error', text:'No se pudo cargar la maquinaria' });
        }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('maqBody');
        const footer = document.getElementById('footerInfo');
        const info   = document.getElementById('info-registros');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="13" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-tractor fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay maquinaria registrada
                </td></tr>`;
            if (footer) footer.textContent = '';
            if (info)   info.textContent   = 'Sin registros';
            initPaginacion({ tbodyId: 'maqBody', filasPorPagina: 10 });
            return;
        }

        if (footer) footer.textContent = '';
        if (info)   info.textContent   = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-2 text-center">
                    ${m.foto_maquina
                        ? `<img src="${m.foto_maquina}"
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
                        ${m.numero_economico||'—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${m.numero_inventario_seder||'—'}
                </td>
                <td class="px-3" style="font-size:13px;">
                    <div class="fw-semibold" style="color:#1a3c5e;font-size:12px;">
                        ${m.tipo_nombre||'—'}
                    </div>
                    <div class="text-muted" style="font-size:11px;">
                        ${[m.marca, m.modelo ? '· '+m.modelo : '', m.anio ? '· '+m.anio : '',
                           m.color ? '· '+m.color : ''].filter(Boolean).join(' ')}
                    </div>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;font-family:monospace;">
                    ${m.serie||'—'}
                </td>
                <td class="px-3 text-muted" style="font-size:12px;font-family:monospace;">
                    ${m.numero_motor||'—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${m.fecha_factura
                        ? new Date(m.fecha_factura).toLocaleDateString('es-MX')
                        : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${m.numero_factura||'—'}
                </td>
                <td class="px-3 text-center">${badgeFisico(m.estado_fisico)}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.ubicacion_nombre||'—'}</td>
                <td class="px-3 text-center">${badgeOperativo(m.estado_operativo)}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalle(${m.pk_maquinaria})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarMaquinaria(${m.pk_maquinaria})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="abrirBaja(${m.pk_maquinaria},
                            '${m.numero_economico}',
                            '${(m.tipo_nombre||'').replace(/'/g,"\\'")}',
                            '${(m.marca||'').replace(/'/g,"\\'")}',
                            '${(m.modelo||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        // Paginación activos (sin sufijo → usa btn-anterior, btn-siguiente, etc.)
        initPaginacion({ tbodyId: 'maqBody', filasPorPagina: 10 });
    }

    // ─────────────────────────────────────────
    // BADGES
    // ─────────────────────────────────────────
    function badgeFisico(estado) {
        const map = {
            bueno:   ['bg-success',           'Bueno'],
            regular: ['bg-warning text-dark',  'Regular'],
            malo:    ['bg-danger',             'Malo']
        };
        const [cls, lbl] = map[estado] || ['bg-secondary', estado||'—'];
        return `<span class="badge ${cls}" style="font-size:11px;">${lbl}</span>`;
    }

    function badgeOperativo(estado) {
        const map = {
            disponible:    ['bg-success',           'Disponible'],
            prestada:      ['bg-info text-dark',    'Prestada'],
            mantenimiento: ['bg-danger',            'Mantenimiento'],
            baja:          ['bg-dark',              'Baja']
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
        renderTabla(_registrosActivos.filter(m => {
            const txt = `${m.numero_economico} ${m.numero_inventario_seder} ${m.tipo_nombre} ${m.marca} ${m.modelo} ${m.serie} ${m.numero_motor}`.toLowerCase();
            return (!q || txt.includes(q)) && (!estado || m.estado_operativo === estado);
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
            const data = await fetchWithAuth('/maquinaria/bajas/registradas');
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
                <tr><td colspan="10" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay equipos dados de baja
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
                <td class="px-3 text-center">
                    ${b.documento_respaldo
                        ? `<a href="${b.documento_respaldo}" target="_blank"
                            class="btn btn-sm btn-outline-danger">
                            <i class="fa-solid fa-file-pdf"></i>
                        </a>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;max-width:200px;">${b.motivo||'—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${b.autorizado_por_nombre||'—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${b.fecha_baja ? new Date(b.fecha_baja).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-primary" title="Editar baja"
                        onclick="abrirEditarBaja(${b.pk_baja})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
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
            const m = await fetchWithAuth(`/maquinaria/${id}`);
            document.getElementById('detalleTitle').textContent =
                `${m.numero_economico} — ${m.tipo_nombre||''}`;
            document.getElementById('detalleBody').innerHTML = `
                ${m.foto_maquina ? `
                <div class="text-center mb-3">
                    <a href="${m.foto_maquina}" target="_blank" title="Ver foto completa">
                        <img src="${m.foto_maquina}"
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
                            ${m.numero_economico||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">N° INVENTARIO SEDER</p>
                        <p class="mb-0">${m.numero_inventario_seder||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">TIPO</p>
                        <p class="mb-0">${m.tipo_nombre||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">MARCA</p>
                        <p class="mb-0">${m.marca||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">MODELO</p>
                        <p class="mb-0">${m.modelo||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">AÑO</p>
                        <p class="mb-0">${m.anio||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">COLOR</p>
                        <p class="mb-0">${m.color||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">SERIE</p>
                        <p class="mb-0" style="font-family:monospace;">${m.serie||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">NÚMERO DE MOTOR</p>
                        <p class="mb-0" style="font-family:monospace;">${m.numero_motor||'—'}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="text-muted mb-1" style="font-size:11px;">UBICACIÓN</p>
                        <p class="mb-0">${m.ubicacion_nombre||'—'}</p>
                    </div>
                    <div class="col-md-3">
                        <p class="text-muted mb-1" style="font-size:11px;">HORAS ACTUALES</p>
                        <p class="mb-0">${m.horas_actuales ?? '—'}</p>
                    </div>
                    <div class="col-md-3">
                        <p class="text-muted mb-1" style="font-size:11px;">COMBUSTIBLE (L)</p>
                        <p class="mb-0">${m.combustible_litros ?? '—'}</p>
                    </div>
                    <div class="col-md-3">
                        <p class="text-muted mb-1" style="font-size:11px;">ESTADO FÍSICO</p>
                        <p class="mb-0">${badgeFisico(m.estado_fisico)}</p>
                    </div>
                    <div class="col-md-3">
                        <p class="text-muted mb-1" style="font-size:11px;">ESTADO OPERATIVO</p>
                        <p class="mb-0">${badgeOperativo(m.estado_operativo)}</p>
                    </div>
                    ${m.descripcion ? `
                    <div class="col-12">
                        <p class="text-muted mb-1" style="font-size:11px;">DESCRIPCIÓN</p>
                        <p class="mb-0">${m.descripcion}</p>
                    </div>` : ''}
                    ${m.numero_factura ? `
                    <div class="col-md-6">
                        <p class="text-muted mb-1" style="font-size:11px;">FACTURA</p>
                        <p class="mb-0">${m.numero_factura}
                            ${m.fecha_factura
                                ? ` — ${new Date(m.fecha_factura).toLocaleDateString('es-MX')}`
                                : ''}
                            ${m.costo_adquisicion
                                ? ` — $${parseFloat(m.costo_adquisicion).toLocaleString('es-MX')}`
                                : ''}
                            ${m.pdf_factura
                                ? `<a href="${m.pdf_factura}" target="_blank" class="ms-2 btn btn-sm btn-outline-danger py-0">
                                    <i class="fa-solid fa-file-pdf"></i> PDF
                                </a>`
                                : ''}
                        </p>
                    </div>` : ''}
                    ${m.fecha_inicio ? `
                    <div class="col-md-6">
                        <p class="text-muted mb-1" style="font-size:11px;">GARANTÍA</p>
                        <p class="mb-0">
                            ${m.fecha_inicio.split('T')[0]}
                            ${m.fecha_fin ? ' → '+m.fecha_fin.split('T')[0] : ''}
                            ${m.garantia_pdf
                                ? `<a href="${m.garantia_pdf}" target="_blank" class="ms-2 btn btn-sm btn-outline-danger py-0">
                                    <i class="fa-solid fa-file-pdf"></i> PDF
                                </a>`
                                : ''}
                        </p>
                    </div>` : ''}
                    <div class="col-12">
                        <p class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</p>
                        <p class="mb-0">${m.registrado_por_usuario||'—'}
                            <span class="text-muted ms-2" style="font-size:11px;">
                                ${m.fecha_registro
                                    ? new Date(m.fecha_registro).toLocaleDateString('es-MX') : ''}
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
        document.getElementById('bajaNumero').textContent     = numero;
        document.getElementById('bajaEquipoDesc').textContent = `${tipo} · ${marca} ${modelo}`.trim();
        document.getElementById('bajaTipoInput').value        = '';
        document.getElementById('bajaMotivoInput').value      = '';
        document.getElementById('bajaAutorizadoInput').value  = '';
        document.getElementById('bajaDocInput').value         = '';
        document.getElementById('docBajaLabel').textContent   = 'Sin documento seleccionado';
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
            await fetchWithAuth(`/maquinaria/${_idParaBaja}/desactivar`, 'PATCH');

            let urlDocumento = null;
            if (_archivoBaja) {
                const formData = new FormData();
                formData.append('archivo', _archivoBaja);
                const resFile = await fetch('/archivo/temporal', {
                    method:  'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body:    formData
                });
                const dataFile = await resFile.json();
                if (dataFile.url) urlDocumento = dataFile.url;
            }

            await fetchWithAuth('/maquinaria/bajas', 'POST', {
                fk_maquinaria:         _idParaBaja,
                tipo_baja:             tipo,
                motivo,
                documento_respaldo:    urlDocumento,
                autorizado_por_nombre: autorizado || null
            });

            bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
            Swal.fire({ icon:'success', title:'Baja registrada',
                text:'El equipo fue dado de baja exitosamente',
                timer:2000, showConfirmButton:false });
            listar();
        } catch(error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    // ─────────────────────────────────────────
// EDITAR BAJA
// ─────────────────────────────────────────
let _archivoEditBaja = null;

window.previsualizarEditDocBaja = function(input) {
    const file = input.files[0];
    if (!file) { _archivoEditBaja = null; return; }
    _archivoEditBaja = file;
    const label = document.getElementById('editDocBajaLabel');
    if (label) label.textContent = file.name;
};

window.abrirEditarBaja = function(id) {
    const b = _registrosBajas.find(x => x.pk_baja === id);
    if (!b) return;

    document.getElementById('editBajaPk').value          = b.pk_baja;
    document.getElementById('editBajaPdfActual').value   = b.documento_respaldo || '';
    document.getElementById('editBajaTipo').value        = b.tipo_baja || '';
    document.getElementById('editBajaMotivo').value      = b.motivo || '';
    document.getElementById('editBajaAutorizado').value  = b.autorizado_por_nombre || '';
    document.getElementById('editBajaDocInput').value    = '';
    document.getElementById('editDocBajaLabel').textContent = 'Sin documento seleccionado';
    _archivoEditBaja = null;

    // Mostrar PDF actual si existe
    const pdfContainer = document.getElementById('editPdfActualContainer');
    const pdfLink      = document.getElementById('editPdfActualLink');
    if (b.documento_respaldo) {
        pdfLink.href = b.documento_respaldo;
        pdfContainer.classList.remove('d-none');
    } else {
        pdfContainer.classList.add('d-none');
    }

    document.getElementById('err_edit_tipo').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('modalEditarBaja')).show();
};

window.guardarEditBaja = async function() {
    const id   = document.getElementById('editBajaPk').value;
    const tipo = document.getElementById('editBajaTipo').value;

    if (!tipo) {
        document.getElementById('err_edit_tipo').classList.remove('d-none');
        return;
    }
    document.getElementById('err_edit_tipo').classList.add('d-none');

    try {
        let documento_respaldo = document.getElementById('editBajaPdfActual').value || null;

        if (_archivoEditBaja) {
            const formData = new FormData();
            formData.append('archivo', _archivoEditBaja);
            const res = await fetch('/archivo/temporal', {
                method:  'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body:    formData
            });
            if (!res.ok) throw new Error('Error al subir el PDF');
            const resData = await res.json();
            documento_respaldo = resData.url;
        }

        await fetchWithAuth(`/maquinaria/bajas/${id}`, 'PUT', {
            tipo_baja:             tipo,
            motivo:                document.getElementById('editBajaMotivo').value.trim() || null,
            autorizado_por_nombre: document.getElementById('editBajaAutorizado').value.trim() || null,
            documento_respaldo
        });

        bootstrap.Modal.getInstance(document.getElementById('modalEditarBaja')).hide();
        Swal.fire({ icon: 'success', title: 'Actualizada',
            text: 'Baja actualizada exitosamente',
            timer: 2000, showConfirmButton: false });
        listarBajas();
    } catch(error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
};

})();

window.mostrarTabla = function() {
    document.getElementById('contenedorFormulario')?.classList.add('d-none');
    document.getElementById('contenedorTabla')?.classList.remove('d-none');
};