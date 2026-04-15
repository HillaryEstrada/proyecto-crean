// ============================================================
//  CREAN · js/modules/maquinaria/maquinaria.js
//  Se carga dinámicamente por menu.js al navegar a la vista.
//  Requiere: fetchWithAuth, getToken, isAuthenticated, isAdmin,
//            cargarVista  (definidos en auth.js / ui.js / menu.js)
//  Bootstrap JS ya está en layout.html — no se reimporta.
// ============================================================

setTimeout(() => {

    // ── Autenticación ─────────────────────────────────────
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    // ── XLSX: cargar si no está disponible ────────────────
    if (typeof XLSX === 'undefined') {
        const s = document.createElement('script');
        s.src = '/libs/xlsx/xlsx.full.min.js';
        s.onload = () => console.log('[Maquinaria] XLSX cargado');
        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════
    //  ESTADO DEL MÓDULO
    // ══════════════════════════════════════════════════════

    let _maqDatos      = [];
    let _maqBajas      = [];
    let _maqEditPk     = null;
    let _maqBajaPk     = null;
    let _maqPasoActual = 1;
    const MAQ_TOTAL_PASOS = 4;

    // ══════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════

    _maqListar();
    _maqCargarTipos();
    _maqCargarUbicaciones();
    _maqCargarProveedores();

    // ══════════════════════════════════════════════════════
    //  API — LISTAR
    // ══════════════════════════════════════════════════════

    async function _maqListar() {
        try {
            const data = await fetchWithAuth('/maquinaria');
            _maqDatos = Array.isArray(data) ? data : [];
            _maqRenderTabla(_maqDatos);
            _maqActualizarBadges();
            _maqPoblarFiltroUbicaciones();
        } catch (err) {
            console.error('[Maquinaria] Error al listar:', err);
            _maqToast('No se pudo cargar la lista de maquinaria', 'danger');
        }
    }

    async function _maqListarBajas() {
        try {
            const data = await fetchWithAuth('/maquinaria/bajas');
            _maqBajas = Array.isArray(data) ? data : [];
            _maqRenderBajas(_maqBajas);
        } catch (err) {
            console.error('[Maquinaria] Error al listar bajas:', err);
        }
    }

    // ══════════════════════════════════════════════════════
    //  CARGAR SELECTS
    // ══════════════════════════════════════════════════════

    async function _maqCargarTipos() {
        try {
            const data = await fetchWithAuth('/maquinaria/tipos');
            const sel  = document.getElementById('maqSelectTipo');
            if (!sel) return;
            const prev = sel.value;
            sel.innerHTML = '<option value="">— Seleccionar tipo —</option>';
            (Array.isArray(data) ? data : []).forEach(t => {
                const o = document.createElement('option');
                o.value = t.id; o.textContent = t.nombre;
                sel.appendChild(o);
            });
            if (prev) sel.value = prev;
        } catch (e) { console.error('[Maquinaria] tipos:', e); }
    }

    async function _maqCargarUbicaciones() {
        try {
            const data = await fetchWithAuth('/maquinaria/ubicaciones');
            const sel  = document.getElementById('maqSelectUbicacion');
            if (!sel) return;
            const prev = sel.value;
            sel.innerHTML = '<option value="">Seleccionar…</option>';
            (Array.isArray(data) ? data : []).forEach(u => {
                const o = document.createElement('option');
                o.value = u.pk_ubicacion;
                o.textContent = u.categoria ? `${u.nombre} (${u.categoria})` : u.nombre;
                sel.appendChild(o);
            });
            if (prev) sel.value = prev;
            _maqPoblarFiltroUbicaciones(data);
        } catch (e) { console.error('[Maquinaria] ubicaciones:', e); }
    }

    async function _maqCargarProveedores() {
        try {
            const data = await fetchWithAuth('/maquinaria/proveedores');
            const sel  = document.getElementById('maqSelectProveedor');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccionar…</option>';
            (Array.isArray(data) ? data : []).forEach(p => {
                const o = document.createElement('option');
                o.value = p.id; o.textContent = p.nombre;
                sel.appendChild(o);
            });
        } catch (e) { console.error('[Maquinaria] proveedores:', e); }
    }

    // ── Carga los selects del modal de ubicación ──────────
    // Intenta cargar tipos de ubicación y categorías desde la API.
    // Si no existen esos endpoints, los selects quedan en "Sin tipo / Sin categoría"
    // y el POST igual funciona enviando null para esos campos.
    async function _maqCargarSelectsUbicacion() {

        // Categorías de ubicación
        try {
            const cats = await fetchWithAuth('/maquinaria/ubicaciones/categorias');
            const selCat = document.getElementById('maqInputUbiCategoria');
            if (selCat) {
                selCat.innerHTML = '<option value="">Sin categoría</option>';
                (Array.isArray(cats) ? cats : []).forEach(c => {
                    const o = document.createElement('option');
                    o.value = c.pk_categoria || c.id;
                    o.textContent = c.nombre;
                    selCat.appendChild(o);
                });
            }
        } catch (e) {
            console.warn('[Maquinaria] categorías de ubicación no disponibles:', e.message);
        }
    }

    function _maqPoblarFiltroUbicaciones(data) {
        const sel = document.getElementById('maqFiltroUbicacion');
        if (!sel) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="">Todas las ubicaciones</option>';
        const fuente = data || _maqDatos;
        const vistas = new Set();
        fuente.forEach(item => {
            const ubi = item.ubicacion_nombre || item.nombre || item.ubicacion || '';
            if (ubi) vistas.add(ubi);
        });
        vistas.forEach(u => {
            const o = document.createElement('option');
            o.value = u; o.textContent = u;
            sel.appendChild(o);
        });
        if (prev) sel.value = prev;
    }

    // ══════════════════════════════════════════════════════
    //  RENDER TABLAS
    // ══════════════════════════════════════════════════════

    function _maqDescFact(m) {
        const p = [];
        if (m.tipo_nombre || m.tipo)  p.push((m.tipo_nombre || m.tipo).toUpperCase());
        if (m.marca)  p.push('MARCA ' + m.marca.toUpperCase());
        if (m.anio)   p.push('AÑO ' + m.anio);
        if (m.modelo) p.push('MODELO ' + m.modelo.toUpperCase());
        if (m.color && m.color !== '—') p.push('COLOR ' + m.color.toUpperCase());
        return p.join(' · ');
    }

    function _maqBadgeOp(estado) {
        const map = {
            disponible:    'badge-maq-disponible',
            en_uso:        'badge-maq-en_uso',
            mantenimiento: 'badge-maq-mantenimiento',
            revision:      'badge-maq-revision',
            baja:          'badge-maq-baja',
        };
        const labels = {
            disponible:'Disponible', en_uso:'En uso',
            mantenimiento:'Mantenimiento', revision:'Revisión', baja:'Baja'
        };
        const cls = map[estado] || 'badge-maq-revision';
        const lbl = labels[estado] || estado || '—';
        return `<span class="badge-maq ${cls}">${lbl}</span>`;
    }

    function _maqBadgeFisico(estado) {
        const clsMap = { bueno:'badge-maq-fisico-b', regular:'badge-maq-fisico-r', malo:'badge-maq-fisico-m' };
        const lblMap = { bueno:'Bueno', regular:'Regular', malo:'Malo' };
        const cls = clsMap[estado] || 'badge-maq-fisico-r';
        const lbl = lblMap[estado] || (estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : '—');
        return `<span class="badge-maq-fisico ${cls}">${lbl}</span>`;
    }

    function _maqFmtFecha(f) {
        if (!f) return '—';
        if (f.includes('/')) return f;
        const [y, mo, d] = f.split('T')[0].split('-');
        return `${d}/${mo}/${y}`;
    }

    function _maqRenderTabla(data) {
        const tbody  = document.getElementById('maqTbody');
        const empty  = document.getElementById('maqEmptyActivos');
        if (!tbody) return;

        if (!data || !data.length) {
            tbody.innerHTML = '';
            empty?.classList.remove('d-none');
            const ri = document.getElementById('registro-info');
            const pi = document.getElementById('pagina-info');
            if (ri) ri.textContent = 'Sin resultados';
            if (pi) pi.textContent = '';
            return;
        }
        empty?.classList.add('d-none');

        tbody.innerHTML = data.map((m, i) => `
            <tr>
              <td class="text-center" style="font-size:12px;color:var(--maq-muted);">${m.prog || (i + 1)}</td>
              <td><span class="maq-eco">${m.numero_economico || m.eco || '—'}</span></td>
              <td style="font-size:12px;color:var(--maq-muted);">${m.numero_inventario_seder || m.inventario || '<span style="color:#ccc;">—</span>'}</td>
              <td><div class="maq-desc">${_maqDescFact(m)}</div></td>
              <td style="font-size:11px;color:var(--maq-muted);">${m.serie || '—'}</td>
              <td style="font-size:12px;">${_maqFmtFecha(m.fecha_factura || m.factFecha)}</td>
              <td style="font-size:12px;">${m.numero_factura || m.factNum || '—'}</td>
              <td class="text-center">${_maqBadgeFisico(m.estado_fisico)}</td>
              <td style="font-size:13px;color:var(--maq-muted);">${m.ubicacion_nombre || m.ubicacion || '—'}</td>
              <td>${_maqBadgeOp(m.estado_operativo)}</td>
            <td>
  <div class="acciones-wrap">

    <button class="btn-act-maq btn-ver"
      onclick="maqVerExpediente(${m.pk_maquinaria || m.pk})">
      <i class="bi bi-eye-fill"></i> Ver expediente
    </button>

    <button class="btn-act-maq btn-edit"
      onclick="maqEditarMaquinaria(${m.pk_maquinaria || m.pk})">
      <i class="bi bi-pencil-fill"></i> Editar
    </button>

    <button class="btn-act-maq btn-baja"
      onclick="maqAbrirBaja(${m.pk_maquinaria || m.pk})">
      <i class="bi bi-slash-circle-fill"></i> Dar de baja
    </button>

  </div>
</td>
            </tr>`).join('');

        if (typeof initPaginacion === 'function') {
            initPaginacion({ tbodyId: 'maqTbody', filasPorPagina: 10 });
        }
    }

    function _maqRenderBajas(data) {
        const tbody = document.getElementById('maqTbodyBajas');
        const empty = document.getElementById('maqEmptyBajas');
        if (!tbody) return;
        if (!data || !data.length) {
            tbody.innerHTML = '';
            empty?.classList.remove('d-none');
            return;
        }
        empty?.classList.add('d-none');
        tbody.innerHTML = data.map((b, i) => `
            <tr>
              <td style="font-size:12px;color:var(--maq-muted);">${i + 1}</td>
              <td><span class="maq-eco">${b.numero_economico || b.eco || '—'}</span></td>
              <td style="font-size:13px;">${b.tipo_nombre || b.tipo || '—'}</td>
              <td style="font-size:13px;">${b.descripcion || (b.marca + ' ' + b.modelo) || '—'}</td>
              <td><span class="badge-maq badge-maq-baja">${b.tipo_baja || '—'}</span></td>
              <td style="font-size:12px;color:var(--maq-muted);">${b.motivo || '—'}</td>
              <td style="font-size:12px;">${_maqFmtFecha(b.fecha_baja)}</td>
              <td style="font-size:12px;">${b.autorizo || '—'}</td>
              <td style="font-size:12px;">${b.solicito || '—'}</td>
            </tr>`).join('');
    }

    // ══════════════════════════════════════════════════════
    //  FILTRO
    // ══════════════════════════════════════════════════════

    window.maqFiltrar = function () {
        const q = (document.getElementById('maqSearch')?.value || '').toLowerCase();
        const e = document.getElementById('maqFiltroEstado')?.value || '';
        const u = document.getElementById('maqFiltroUbicacion')?.value || '';
        const f = _maqDatos.filter(m => {
            const eco  = m.numero_economico || m.eco || '';
            const tipo = m.tipo_nombre || m.tipo || '';
            const marc = m.marca || '';
            const mod  = m.modelo || '';
            const ser  = m.serie || '';
            const ubi  = m.ubicacion_nombre || m.ubicacion || '';
            const matchQ = !q || `${eco} ${tipo} ${marc} ${mod} ${ser}`.toLowerCase().includes(q);
            const matchE = !e || m.estado_operativo === e;
            const matchU = !u || ubi === u;
            return matchQ && matchE && matchU;
        });
        _maqRenderTabla(f);
    };

    // ══════════════════════════════════════════════════════
    //  TABS
    // ══════════════════════════════════════════════════════

    window.maqSwitchTab = function (tab) {
        const vA = document.getElementById('maqVistaActivos');
        const vB = document.getElementById('maqVistaBajas');
        const tA = document.getElementById('maqTabActivos');
        const tB = document.getElementById('maqTabBajas');
        if (tab === 'activos') {
            vA?.classList.remove('d-none'); vB?.classList.add('d-none');
            tA?.classList.add('active'); tA?.classList.remove('active-danger');
            tB?.classList.remove('active', 'active-danger');
        } else {
            vB?.classList.remove('d-none'); vA?.classList.add('d-none');
            tB?.classList.add('active', 'active-danger');
            tA?.classList.remove('active');
            _maqListarBajas();
        }
    };

    function _maqActualizarBadges() {}

    // ══════════════════════════════════════════════════════
    //  WIZARD
    // ══════════════════════════════════════════════════════

    window.maqIniciarWizard = function () {
        _maqEditPk = null;
        _maqPasoActual = 1;
        _maqLimpiarWizard();
        _maqCargarTipos();
        _maqCargarUbicaciones();
        _maqCargarProveedores();
        _maqRenderizarPaso(1);
        const titulo = document.getElementById('maqWizardTitulo');
        if (titulo) titulo.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Maquinaria';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalWizard')).show();
    };

    function _maqLimpiarWizard() {
        const ids = [
            'maqNumEco','maqNumSeder','maqDescripcion',
            'maqMarca','maqModelo','maqAnio','maqColor','maqSerie',
            'maqNumFactura','maqFechaFactura',
            'maqGarInicio','maqGarFin','maqGarHoras',
            'maqHorasHorometro','maqDiesel','maqObservaciones'
        ];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        ['maqPdfFactura','maqPdfGarantia','maqFotoEquipo'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        ['maqSelectTipo','maqSelectUbicacion','maqSelectProveedor',
         'maqEstadoFisico','maqEstadoOp'].forEach(id => {
            const el = document.getElementById(id); if (el) el.selectedIndex = 0;
        });
        const prev = document.getElementById('maqFotoPreview');
        const ph   = document.getElementById('maqFotoPh');
        if (prev) { prev.src = ''; prev.style.display = 'none'; }
        if (ph)   ph.style.display = '';
        ['maqNombreFactura','maqNombreGarantia'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = ''; el.classList.add('d-none'); }
        });
        document.getElementById('maqGarBody')?.classList.add('d-none');
        const lbl = document.getElementById('maqGarToggle');
        if (lbl) lbl.textContent = '+ Agregar';
        document.querySelectorAll('.maq-field-error').forEach(el => el.classList.remove('visible'));
    }

    function _maqRenderizarPaso(paso) {
        for (let i = 1; i <= MAQ_TOTAL_PASOS; i++) {
            document.getElementById(`maqPage${i}`)?.classList.add('d-none');
        }
        document.getElementById(`maqPage${paso}`)?.classList.remove('d-none');
        _maqActualizarStepper(paso);

        const btnAnt = document.getElementById('maqBtnAnterior');
        const btnSig = document.getElementById('maqBtnSiguiente');
        const btnGrd = document.getElementById('maqBtnGuardar');
        const ind    = document.getElementById('maqIndicador');

        btnAnt?.classList.toggle('d-none', paso === 1);
        btnSig?.classList.toggle('d-none', paso === MAQ_TOTAL_PASOS);
        btnGrd?.classList.toggle('d-none', paso !== MAQ_TOTAL_PASOS);
        if (ind) ind.textContent = `Paso ${paso} de ${MAQ_TOTAL_PASOS}`;
    }

    function _maqActualizarStepper(paso) {
        // Los iconos del stepper están definidos en el HTML (bi-person-badge, bi-gear, etc.)
        // Solo manejamos clases active/done; el icono ✓ lo mostramos en done con CSS o añadiendo clase
        for (let i = 1; i <= MAQ_TOTAL_PASOS; i++) {
            const step   = document.getElementById(`maqStep${i}`);
            const circle = step?.querySelector('.maq-wz-circle');
            if (!step) continue;
            step.classList.remove('active', 'done');
            if (i < paso) {
                step.classList.add('done');
                // En "done" mostramos el ícono check encima del ícono original
                if (circle) {
                    // Guardamos el icono original si no lo hemos guardado aún
                    if (!circle.dataset.origIcon) {
                        const origI = circle.querySelector('i');
                        if (origI) circle.dataset.origIcon = origI.className;
                    }
                    const icon = circle.querySelector('i');
                    if (icon) icon.className = 'bi bi-check-lg';
                }
            } else if (i === paso) {
                step.classList.add('active');
                // Restaurar icono original si venimos de un estado "done"
                if (circle && circle.dataset.origIcon) {
                    const icon = circle.querySelector('i');
                    if (icon) icon.className = circle.dataset.origIcon;
                }
            } else {
                // Restaurar icono original
                if (circle && circle.dataset.origIcon) {
                    const icon = circle.querySelector('i');
                    if (icon) icon.className = circle.dataset.origIcon;
                }
            }
            if (i < MAQ_TOTAL_PASOS) {
                const line = document.getElementById(`maqLine${i}`);
                if (line) line.classList.toggle('done', i < paso);
            }
        }
    }

    window.maqSiguientePaso = function () {
        if (!_maqValidarPaso(_maqPasoActual)) return;
        if (_maqPasoActual < MAQ_TOTAL_PASOS) {
            _maqPasoActual++;
            _maqRenderizarPaso(_maqPasoActual);
        }
    };

    window.maqAnteriorPaso = function () {
        if (_maqPasoActual > 1) {
            _maqPasoActual--;
            _maqRenderizarPaso(_maqPasoActual);
        }
    };

    function _maqValidarPaso(paso) {
        let ok = true;
        function req(fieldId, errId) {
            const el  = document.getElementById(fieldId);
            const err = document.getElementById(errId);
            if (!el?.value?.trim()) { err?.classList.add('visible'); ok = false; }
            else err?.classList.remove('visible');
        }
        if (paso === 1) { req('maqNumEco','maqErrNumEco'); req('maqSelectTipo','maqErrTipo'); }
        if (paso === 2) { req('maqMarca','maqErrMarca'); req('maqModelo','maqErrModelo'); req('maqEstadoFisico','maqErrEstadoFisico'); req('maqSelectUbicacion','maqErrUbicacion'); }
        if (paso === 3) { req('maqNumFactura','maqErrNumFactura'); req('maqFechaFactura','maqErrFechaFactura'); }
        return ok;
    }

    window.maqCerrarWizard = function () {
        bootstrap.Modal.getInstance(document.getElementById('maqModalWizard'))?.hide();
    };

    // ── Foto preview ──────────────────────────────────────
    window.maqPreviewFoto = function (input) {
        if (!input.files?.[0]) return;
        const reader = new FileReader();
        reader.onload = e => {
            const prev = document.getElementById('maqFotoPreview');
            const ph   = document.getElementById('maqFotoPh');
            if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
            if (ph)   ph.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    };

    window.maqMostrarArchivo = function (input, targetId) {
        const div = document.getElementById(targetId);
        if (!div || !input.files?.length) return;
        div.textContent = '✓ ' + input.files[0].name;
        div.classList.remove('d-none');
    };

    window.maqToggleGarantia = function () {
        const body = document.getElementById('maqGarBody');
        const lbl  = document.getElementById('maqGarToggle');
        if (!body) return;
        const hidden = body.classList.toggle('d-none');
        if (lbl) lbl.textContent = hidden ? '+ Agregar' : '− Quitar';
    };

    // ══════════════════════════════════════════════════════
    //  GUARDAR
    // ══════════════════════════════════════════════════════

    window.maqGuardar = async function () {
        if (!_maqValidarPaso(MAQ_TOTAL_PASOS)) return;

        const payload = {
            numero_economico:        document.getElementById('maqNumEco')?.value?.trim()        || null,
            numero_inventario_seder: document.getElementById('maqNumSeder')?.value?.trim()      || null,
            fk_tipo:                 document.getElementById('maqSelectTipo')?.value            || null,
            fk_ubicacion:            document.getElementById('maqSelectUbicacion')?.value       || null,
            descripcion:             document.getElementById('maqDescripcion')?.value?.trim()   || null,
            marca:                   document.getElementById('maqMarca')?.value?.trim()         || null,
            modelo:                  document.getElementById('maqModelo')?.value?.trim()        || null,
            anio:                    document.getElementById('maqAnio')?.value                  || null,
            color:                   document.getElementById('maqColor')?.value?.trim()         || null,
            serie:                   document.getElementById('maqSerie')?.value?.trim()         || null,
            estado_fisico:           document.getElementById('maqEstadoFisico')?.value          || 'bueno',
            estado_operativo:        document.getElementById('maqEstadoOp')?.value              || 'disponible',
            numero_factura:          document.getElementById('maqNumFactura')?.value?.trim()    || null,
            fecha_factura:           document.getElementById('maqFechaFactura')?.value          || null,
            fk_proveedor:            document.getElementById('maqSelectProveedor')?.value       || null,
            garantia_inicio:         document.getElementById('maqGarInicio')?.value             || null,
            garantia_fin:            document.getElementById('maqGarFin')?.value                || null,
            limite_horas:            document.getElementById('maqGarHoras')?.value              || null,
            horas_horometro:         document.getElementById('maqHorasHorometro')?.value        || 0,
            diesel_tanque:           document.getElementById('maqDiesel')?.value                || 0,
            observaciones:           document.getElementById('maqObservaciones')?.value?.trim() || null,
        };

        const pdfFact = document.getElementById('maqPdfFactura');
        if (pdfFact?.files?.length)
            payload.pdf_factura = await _maqLeerBase64(pdfFact.files[0]);

        const pdfGar = document.getElementById('maqPdfGarantia');
        if (pdfGar?.files?.length)
            payload.pdf_garantia = await _maqLeerBase64(pdfGar.files[0]);

        const foto = document.getElementById('maqFotoEquipo');
        if (foto?.files?.length)
            payload.foto = await _maqLeerBase64(foto.files[0]);

        try {
            if (_maqEditPk) {
                await fetchWithAuth(`/maquinaria/${_maqEditPk}`, 'PUT', payload);
                _maqToast('Maquinaria actualizada correctamente');
            } else {
                await fetchWithAuth('/maquinaria', 'POST', payload);
                _maqToast('Maquinaria registrada correctamente');
            }
            bootstrap.Modal.getInstance(document.getElementById('maqModalWizard'))?.hide();
            _maqListar();
        } catch (err) {
            _maqToast(err.message || 'No se pudo guardar la maquinaria', 'danger');
        }
    };

    // ══════════════════════════════════════════════════════
    //  EDITAR
    // ══════════════════════════════════════════════════════

    window.maqEditarMaquinaria = async function (pk) {
        try {
            const m = await fetchWithAuth(`/maquinaria/${pk}`);
            _maqEditPk = pk;
            _maqPasoActual = 1;
            _maqLimpiarWizard();
            await _maqCargarTipos();
            await _maqCargarUbicaciones();
            await _maqCargarProveedores();
            _maqRenderizarPaso(1);

            _maqSetVal('maqNumEco',         m.numero_economico);
            _maqSetVal('maqNumSeder',        m.numero_inventario_seder);
            _maqSetVal('maqDescripcion',     m.descripcion);
            _maqSetVal('maqSelectTipo',      m.fk_tipo);
            _maqSetVal('maqMarca',           m.marca);
            _maqSetVal('maqModelo',          m.modelo);
            _maqSetVal('maqAnio',            m.anio);
            _maqSetVal('maqColor',           m.color);
            _maqSetVal('maqSerie',           m.serie);
            _maqSetVal('maqEstadoFisico',    m.estado_fisico);
            _maqSetVal('maqEstadoOp',        m.estado_operativo || 'disponible');
            _maqSetVal('maqSelectUbicacion', m.fk_ubicacion);
            _maqSetVal('maqNumFactura',      m.numero_factura);
            _maqSetVal('maqFechaFactura',    m.fecha_factura?.split('T')[0]);
            _maqSetVal('maqSelectProveedor', m.fk_proveedor);
            _maqSetVal('maqGarInicio',       m.garantia_inicio?.split('T')[0]);
            _maqSetVal('maqGarFin',          m.garantia_fin?.split('T')[0]);
            _maqSetVal('maqGarHoras',        m.limite_horas);

            const titulo = document.getElementById('maqWizardTitulo');
            if (titulo) titulo.innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Maquinaria';
            bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalWizard')).show();
        } catch (err) {
            _maqToast('No se pudo cargar la maquinaria para editar', 'danger');
        }
    };

    function _maqSetVal(id, val) {
        const el = document.getElementById(id);
        if (el && val != null) el.value = val;
    }

    // ══════════════════════════════════════════════════════
    //  EXPEDIENTE
    // ══════════════════════════════════════════════════════

    window.maqVerExpediente = function (pk) {
        cargarVista('maquinaria/operacion?id=' + pk);
    };

    // ══════════════════════════════════════════════════════
    //  BAJA
    // ══════════════════════════════════════════════════════

    window.maqAbrirBaja = function (pk) {
        _maqBajaPk = pk;
        const m = _maqDatos.find(x => (x.pk_maquinaria || x.pk) == pk);
        if (!m) return;
        document.getElementById('maqBajaEco').textContent  = m.numero_economico || m.eco || '—';
        document.getElementById('maqBajaDesc').textContent =
            `${m.tipo_nombre || m.tipo || ''} · ${m.marca || ''} ${m.modelo || ''}`.trim();
        document.getElementById('maqBajaTipo').value   = '';
        document.getElementById('maqBajaMotivo').value = '';
        document.getElementById('maqPanelSolicitud')?.classList.remove('d-none');
        document.getElementById('maqPanelEsperando')?.classList.add('d-none');
        document.getElementById('maqPanelAutorizado')?.classList.add('d-none');
        document.getElementById('maqBtnEnviarBaja')?.classList.remove('d-none');
        document.getElementById('maqBtnConfirmarBaja')?.classList.add('d-none');
        ['maqErrBajaTipo','maqErrBajaMotivo'].forEach(id =>
            document.getElementById(id)?.classList.remove('visible'));
        bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalBaja')).show();
    };

    window.maqEnviarSolicitudBaja = function () {
        const tipo   = document.getElementById('maqBajaTipo')?.value;
        const motivo = document.getElementById('maqBajaMotivo')?.value?.trim();
        let ok = true;
        if (!tipo)   { document.getElementById('maqErrBajaTipo')?.classList.add('visible'); ok = false; }
        else          document.getElementById('maqErrBajaTipo')?.classList.remove('visible');
        if (!motivo) { document.getElementById('maqErrBajaMotivo')?.classList.add('visible'); ok = false; }
        else          document.getElementById('maqErrBajaMotivo')?.classList.remove('visible');
        if (!ok) return;

        document.getElementById('maqPanelSolicitud')?.classList.add('d-none');
        document.getElementById('maqPanelEsperando')?.classList.remove('d-none');
        document.getElementById('maqBtnEnviarBaja')?.classList.add('d-none');

        setTimeout(() => {
            document.getElementById('maqPanelEsperando')?.classList.add('d-none');
            document.getElementById('maqPanelAutorizado')?.classList.remove('d-none');
            document.getElementById('maqBtnConfirmarBaja')?.classList.remove('d-none');
        }, 2000);
    };

 // ── BAJA ─────────────────────────────────
window.maqAbrirBaja = function (pk) {
    _maqBajaPk = pk;
    const m = _maqDatos.find(x => (x.pk_maquinaria || x.pk) == pk);
    if (!m) { _maqToast('No se encontró el equipo', 'danger'); return; }

    document.getElementById('maqBajaEco').textContent  = m.numero_economico || m.eco || '—';
    document.getElementById('maqBajaDesc').textContent =
        `${m.tipo_nombre || m.tipo || ''} · ${m.marca || ''} ${m.modelo || ''}`.trim() || '—';

    document.getElementById('maqBajaTipo').value      = '';
    document.getElementById('maqBajaMotivo').value    = '';
    document.getElementById('maqBajaDocumento').value = '';
    document.getElementById('maqBajaAutorizadoPor').innerHTML =
        '<option value="">Seleccionar usuario…</option>';

    ['maqErrBajaTipo','maqErrBajaMotivo','maqErrBajaAutorizado'].forEach(id =>
        document.getElementById(id)?.classList.remove('visible'));

    _maqCargarUsuariosSelect();   // ← carga usuarios

    bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalBaja')).show();

};

    // ══════════════════════════════════════════════════════
    //  MODALES AUXILIARES — TIPO / UBICACIÓN / PROVEEDOR
    // ══════════════════════════════════════════════════════

    window.maqAbrirModalTipo = function () {
        document.getElementById('maqInputTipo').value = '';
        document.getElementById('maqErrInputTipo')?.classList.remove('visible');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalTipo')).show();
    };

    window.maqConfirmarTipo = async function () {
        const input = document.getElementById('maqInputTipo');
        const err   = document.getElementById('maqErrInputTipo');
        const raw   = input?.value?.trim();
        if (!raw) { err?.classList.add('visible'); return; }
        err?.classList.remove('visible');
        const nombre = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        try {
            const res = await fetchWithAuth('/maquinaria/tipos', 'POST', { nombre });
            bootstrap.Modal.getInstance(document.getElementById('maqModalTipo'))?.hide();
            await _maqCargarTipos();
            if (res?.id) document.getElementById('maqSelectTipo').value = res.id;
            _maqToast(`Tipo de equipo agregado: ${nombre}`);
        } catch (err2) {
            _maqToast(err2.message || 'No se pudo crear el tipo', 'danger');
        }
    };

    // ── Modal Nueva Ubicación — carga tipos/categorías y envía payload completo ──

    window.maqAbrirModalUbicacion = function () {
        // Limpiar campos
        ['maqInputUbicacion','maqInputUbiDesc'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        ['maqInputUbiTipo','maqInputUbiCategoria'].forEach(id => {
            const el = document.getElementById(id); if (el) el.selectedIndex = 0;
        });
        document.getElementById('maqErrInputUbicacion')?.classList.remove('visible');

        // Cargar selects de forma asíncrona (no bloquea la apertura del modal)
        _maqCargarSelectsUbicacion();

        bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalUbicacion')).show();
    };

    window.maqConfirmarUbicacion = async function () {
        const input = document.getElementById('maqInputUbicacion');
        const err   = document.getElementById('maqErrInputUbicacion');
        const raw   = input?.value?.trim();
        if (!raw) { err?.classList.add('visible'); return; }
        err?.classList.remove('visible');

        const nombre = raw.charAt(0).toUpperCase() + raw.slice(1);

        // Construir payload con todos los campos de la tabla
        const payload = {
            nombre,
            descripcion:   document.getElementById('maqInputUbiDesc')?.value?.trim()        || null,
            fk_tipo:       document.getElementById('maqInputUbiTipo')?.value                || null,
            fk_categoria:  document.getElementById('maqInputUbiCategoria')?.value           || null,
        };

        // Eliminar nulos para que el servidor use sus defaults
        Object.keys(payload).forEach(k => { if (payload[k] === null || payload[k] === '') delete payload[k]; });

        try {
            const res = await fetchWithAuth('/maquinaria/ubicaciones', 'POST', payload);
            bootstrap.Modal.getInstance(document.getElementById('maqModalUbicacion'))?.hide();
            await _maqCargarUbicaciones();
            // Seleccionar la nueva ubicación en el select del wizard
            const pk = res?.pk_ubicacion || res?.id;
            if (pk) {
                const sel = document.getElementById('maqSelectUbicacion');
                if (sel) sel.value = pk;
            }
            _maqToast(`Ubicación agregada: ${nombre}`);
        } catch (err2) {
            _maqToast(err2.message || 'No se pudo crear la ubicación', 'danger');
        }
    };

    window.maqAbrirModalProveedor = function () {
        ['maqProvNombre','maqProvDir','maqProvTel','maqProvCorreo'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        document.getElementById('maqErrProvNombre')?.classList.remove('visible');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('maqModalProveedor')).show();
    };

    window.maqConfirmarProveedor = async function () {
        const nombre = document.getElementById('maqProvNombre')?.value?.trim();
        const err    = document.getElementById('maqErrProvNombre');
        if (!nombre) { err?.classList.add('visible'); return; }
        err?.classList.remove('visible');

        const payload = {
            nombre:    nombre.charAt(0).toUpperCase() + nombre.slice(1),
            direccion: document.getElementById('maqProvDir')?.value?.trim()    || null,
            telefono:  document.getElementById('maqProvTel')?.value?.trim()    || null,
            correo:    document.getElementById('maqProvCorreo')?.value?.trim() || null,
        };

        try {
            const res = await fetchWithAuth('/maquinaria/proveedores', 'POST', payload);
            bootstrap.Modal.getInstance(document.getElementById('maqModalProveedor'))?.hide();
            await _maqCargarProveedores();
            if (res?.id) document.getElementById('maqSelectProveedor').value = res.id;
            _maqToast(`Proveedor agregado: ${payload.nombre}`);
        } catch (err2) {
            _maqToast(err2.message || 'No se pudo crear el proveedor', 'danger');
        }
    };

    // ══════════════════════════════════════════════════════
    //  EXPORTAR EXCEL
    // ══════════════════════════════════════════════════════

    window.maqExportarExcel = function () {
        if (typeof XLSX === 'undefined') {
            _maqToast('La librería Excel no está disponible aún. Intenta de nuevo.', 'warning');
            return;
        }
        const datos = _maqDatos.map((m, i) => ({
            '# PROG':               i + 1,
            '# ECO':                m.numero_economico || m.eco || '',
            'NUM INVENTARIO SEDER': m.numero_inventario_seder || m.inventario || '',
            'TIPO':                 m.tipo_nombre || m.tipo || '',
            'DESCRIPCIÓN':          m.descripcion || '',
            'MARCA':                m.marca || '',
            'COLOR':                m.color || '',
            'MODELO':               m.modelo || '',
            'AÑO':                  m.anio || '',
            'SERIE':                m.serie || '',
            'FACTURA NÚMERO':       m.numero_factura || m.factNum || '',
            'FACTURA FECHA':        _maqFmtFecha(m.fecha_factura || m.factFecha),
            'ESTADO (B,R,M)':       (m.estado_fisico || '')[0]?.toUpperCase() || '',
            'UBICACIÓN':            m.ubicacion_nombre || m.ubicacion || '',
            'ESTADO OPERATIVO':     m.estado_operativo || '',
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        ws['!cols'] = [
            {wch:8},{wch:12},{wch:22},{wch:14},{wch:30},{wch:15},
            {wch:10},{wch:12},{wch:6},{wch:18},{wch:18},{wch:14},{wch:14},{wch:16},{wch:16}
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario Maquinaria');
        const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g,'-');
        XLSX.writeFile(wb, `CREAN_Inventario_Maquinaria_${fecha}.xlsx`);
        _maqToast('Archivo Excel exportado correctamente');
    };

    // ══════════════════════════════════════════════════════
    //  UTILIDADES
    // ══════════════════════════════════════════════════════

    function _maqLeerBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload  = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    function _maqToast(msg, tipo = 'success') {
        if (typeof toastSuccess === 'function' && tipo === 'success') { toastSuccess(msg); return; }
        if (typeof toastError   === 'function' && tipo === 'danger')  { toastError(msg);   return; }
        if (typeof toastWarn    === 'function' && tipo === 'warning') { toastWarn(msg);    return; }
        const container = document.getElementById('toastContainer') || document.body;
        const bg = { success:'#2e7d32', danger:'#b2382d', warning:'#d97706' }[tipo] || '#1a3c5e';
        const id = 'maqToast_' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div id="${id}" class="toast align-items-center text-white border-0 show"
                 role="alert" style="background:${bg};border-radius:12px;min-width:280px;
                 box-shadow:0 8px 24px rgba(0,0,0,.15);margin-bottom:8px;">
              <div class="d-flex">
                <div class="toast-body" style="font-size:13px;font-weight:500;">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                  onclick="document.getElementById('${id}').remove()"></button>
              </div>
            </div>`);
        setTimeout(() => document.getElementById(id)?.remove(), 3500);
    }

}, 100);