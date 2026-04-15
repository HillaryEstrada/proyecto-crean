// ============================================
// JAVASCRIPT: expediente.js
// Descripción: Lógica del expediente de maquinaria (solo lectura)
// Depende de: auth.js (fetchWithAuth), Bootstrap 5, SweetAlert2
// Se carga dinámicamente por cargarVista() después de expediente.html
// ============================================

setTimeout(async () => {

    // ── Leer el ID desde la URL (ej: /views/maquinaria/expediente.html?id=5) ──
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) {
        document.getElementById('expSubtitulo').textContent = 'ID de maquinaria no especificado.';
        return;
    }

    // ── Cargar expediente completo ──────────────────────────────────────────
    let exp;
    try {
        exp = await fetchWithAuth(`/maquinaria/${id}/expediente`);
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el expediente.' });
        return;
    }

    const { maquinaria, factura, garantia, kpis, alertas,
            historial, uso, mantenimientos, fallas, checklist } = exp;

    // ════════════════════════════════════════════════
    // CABECERA
    // ════════════════════════════════════════════════
    document.getElementById('expSubtitulo').textContent =
        `${maquinaria.numero_economico} · ${maquinaria.tipo_equipo} · ${maquinaria.marca || ''} ${maquinaria.modelo || ''}`.trim();

    const badgesEl = document.getElementById('expBadges');
    badgesEl.innerHTML = `
        ${badgeEstadoOp(maquinaria.estado_operativo)}
        ${garantia
            ? garantia.estado === 'vencida'
                ? `<span class="badge bg-danger">Garantía vencida</span>`
                : `<span class="badge bg-success">Garantía vigente</span>`
            : `<span class="badge bg-secondary">Sin garantía</span>`
        }
    `;

    // ════════════════════════════════════════════════
    // SECCIÓN 1 – ALERTAS
    // ════════════════════════════════════════════════
    if (alertas.length) {
        document.getElementById('seccionAlertas').classList.remove('d-none');
        const cont = document.getElementById('contenedorAlertas');

        const nivelIcono = { warning: 'fa-exclamation-circle', danger: 'fa-times-circle', info: 'fa-info-circle' };
        const nivelColor = { warning: '#fff3cd', danger: '#f8d7da', info: '#d1ecf1' };
        const nivelBorde = { warning: '#ffc107', danger: '#dc3545', info: '#0dcaf0' };

        cont.innerHTML = alertas.map(a => `
            <div class="col-md-4">
                <div class="p-3 rounded-3 d-flex gap-3 align-items-start"
                     style="background:${nivelColor[a.nivel] || '#f8f9fa'};
                            border-left:4px solid ${nivelBorde[a.nivel] || '#6c757d'};">
                    <i class="fa-solid ${nivelIcono[a.nivel] || 'fa-bell'} mt-1"
                       style="color:${nivelBorde[a.nivel] || '#6c757d'}; font-size:18px;"></i>
                    <div>
                        <div class="fw-semibold" style="font-size:13px;">${a.titulo}</div>
                        <div class="text-muted small">${a.detalle || ''}</div>
                        ${a.fecha ? `<div class="text-muted" style="font-size:11px;">${fmtFecha(a.fecha)}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ════════════════════════════════════════════════
    // SECCIÓN 2 – DATOS GENERALES
    // ════════════════════════════════════════════════
    const filasGenerales = [
        ['Número Económico', `<span class="fw-bold" style="font-family:monospace;">${maquinaria.numero_economico}</span>`],
        ['Tipo de Equipo',   maquinaria.tipo_equipo   || '—'],
        ['Marca',            maquinaria.marca          || '—'],
        ['Modelo',           maquinaria.modelo         || '—'],
        ['Año',              maquinaria.anio           || '—'],
        ['Ubicación',        maquinaria.ubicacion      || '—'],
        ['Estado',           badgeEstadoOp(maquinaria.estado_operativo)],
    ];

    document.querySelector('#tabDatosGenerales tbody').innerHTML = filasGenerales.map(([k, v]) => `
        <tr>
            <td class="text-muted pe-3" style="font-size:12px; white-space:nowrap;">${k}</td>
            <td style="font-size:13px;">${v}</td>
        </tr>
    `).join('');

    // ════════════════════════════════════════════════
    // SECCIÓN 2 – KPIs
    // ════════════════════════════════════════════════
    const tarjetasKpi = [
        {
            icono: 'fa-clock',
            color: '#1a3c5e',
            valor: Number(kpis.horas_actuales || 0).toFixed(1),
            unidad: 'hrs',
            label: 'Horas totales',
        },
        {
            icono: 'fa-gas-pump',
            color: '#198754',
            valor: Number(kpis.combustible_litros || 0).toFixed(1),
            unidad: 'L',
            label: 'Combustible total',
        },
        {
            icono: 'fa-wrench',
            color: '#0d6efd',
            valor: kpis.total_mantenimientos || 0,
            unidad: '',
            label: 'Mantenimientos',
        },
        {
            icono: 'fa-triangle-exclamation',
            color: '#dc3545',
            valor: kpis.total_fallas || 0,
            unidad: '',
            label: 'Fallas registradas',
        },
        {
            icono: 'fa-dollar-sign',
            color: '#6f42c1',
            valor: `$${Number(kpis.costo_total_mantenimiento || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            unidad: '',
            label: 'Costo mantenimiento',
        },
    ];

    document.getElementById('contenedorKpis').innerHTML = tarjetasKpi.map(t => `
        <div class="col-sm-6 col-xl-4">
            <div class="card border-0 shadow-sm h-100" style="border-radius:12px;">
                <div class="card-body d-flex align-items-center gap-3 p-3">
                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                         style="width:48px; height:48px; background:${t.color}1a;">
                        <i class="fa-solid ${t.icono}" style="color:${t.color}; font-size:18px;"></i>
                    </div>
                    <div>
                        <div class="fw-bold" style="font-size:20px; color:${t.color}; line-height:1;">
                            ${t.valor}<small class="text-muted" style="font-size:12px;"> ${t.unidad}</small>
                        </div>
                        <div class="text-muted" style="font-size:12px;">${t.label}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // ════════════════════════════════════════════════
    // FACTURA Y GARANTÍA
    // ════════════════════════════════════════════════
    document.getElementById('colFactura').innerHTML = factura ? `
        <div class="card border-0 shadow-sm" style="border-radius:12px;">
            <div class="card-header fw-semibold text-white py-2 px-4" style="background:#1a3c5e; font-size:13px;">
                <i class="fa-solid fa-file-invoice-dollar me-2"></i>Factura de Compra
            </div>
            <div class="card-body p-3">
                <table class="table table-sm table-borderless mb-0">
                    <tbody>
                        <tr><td class="text-muted" style="font-size:12px;">N° Factura</td>
                            <td style="font-size:13px;">${factura.numero_factura || '—'}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Fecha Compra</td>
                            <td style="font-size:13px;">${fmtFecha(factura.fecha_compra)}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Proveedor</td>
                            <td style="font-size:13px;">${factura.proveedor || '—'}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Monto</td>
                            <td style="font-size:13px; font-weight:600;">
                                $${Number(factura.monto_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td></tr>
                    </tbody>
                </table>
            </div>
        </div>` : `
        <div class="card border-0 shadow-sm" style="border-radius:12px;">
            <div class="card-body text-center text-muted py-4" style="font-size:13px;">
                <i class="fa-solid fa-file-invoice-dollar fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin factura registrada
            </div>
        </div>`;

    document.getElementById('colGarantia').innerHTML = garantia ? `
        <div class="card border-0 shadow-sm" style="border-radius:12px;">
            <div class="card-header fw-semibold text-white py-2 px-4"
                 style="background:${garantia.estado === 'vencida' ? '#b2382d' : '#198754'}; font-size:13px;">
                <i class="fa-solid fa-shield-halved me-2"></i>
                Garantía — <span>${garantia.estado === 'vencida' ? 'Vencida' : 'Vigente'}</span>
            </div>
            <div class="card-body p-3">
                <table class="table table-sm table-borderless mb-0">
                    <tbody>
                        <tr><td class="text-muted" style="font-size:12px;">N° Garantía</td>
                            <td style="font-size:13px;">${garantia.numero_garantia || '—'}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Inicio</td>
                            <td style="font-size:13px;">${fmtFecha(garantia.fecha_inicio)}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Vencimiento</td>
                            <td style="font-size:13px;">${fmtFecha(garantia.fecha_fin)}</td></tr>
                        <tr><td class="text-muted" style="font-size:12px;">Proveedor</td>
                            <td style="font-size:13px;">${garantia.proveedor || '—'}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>` : `
        <div class="card border-0 shadow-sm" style="border-radius:12px;">
            <div class="card-body text-center text-muted py-4" style="font-size:13px;">
                <i class="fa-solid fa-shield-halved fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin garantía registrada
            </div>
        </div>`;

    // ════════════════════════════════════════════════
    // TAB: HISTORIAL (timeline)
    // ════════════════════════════════════════════════
    const iconoOrigen = {
        mantenimiento: { i: 'fa-wrench',               c: '#0d6efd' },
        uso:           { i: 'fa-gauge',                 c: '#198754' },
        estado:        { i: 'fa-arrow-right-arrow-left',c: '#6f42c1' },
    };

    document.getElementById('timelineContainer').innerHTML = historial.length
        ? historial.map(h => {
            const cfg = iconoOrigen[h.origen] || { i: 'fa-circle', c: '#6c757d' };
            return `
            <div class="d-flex gap-3 mb-3 align-items-start">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                     style="width:34px; height:34px; background:${cfg.c}1a; border:2px solid ${cfg.c};">
                    <i class="fa-solid ${cfg.i}" style="color:${cfg.c}; font-size:12px;"></i>
                </div>
                <div class="flex-grow-1 border-bottom pb-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <span class="fw-semibold" style="font-size:13px;">${h.titulo}</span>
                        <span class="text-muted" style="font-size:11px; white-space:nowrap;">${fmtFecha(h.fecha)}</span>
                    </div>
                    <div class="text-muted small">${h.detalle || ''}</div>
                </div>
            </div>`;
        }).join('')
        : `<p class="text-center text-muted py-4">Sin historial registrado.</p>`;

    // ════════════════════════════════════════════════
    // TAB: USO
    // ════════════════════════════════════════════════
    document.getElementById('usoBody').innerHTML = uso.length
        ? uso.map((u, i) => `
            <tr>
                <td class="px-3" style="font-size:13px;">${fmtFecha(u.fecha)}</td>
                <td class="px-3 text-center fw-bold" style="font-size:13px;">${u.horas_trabajadas || 0}</td>
                <td class="px-3 text-center" style="font-size:13px;">${u.combustible_litros || 0}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.operador || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.actividad || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${u.observaciones || '—'}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="6" class="text-center py-5 text-muted">Sin registros de uso.</td></tr>`;

    // ════════════════════════════════════════════════
    // TAB: MANTENIMIENTOS
    // ════════════════════════════════════════════════
    document.getElementById('mantenimientosBody').innerHTML = mantenimientos.length
        ? mantenimientos.map(m => `
            <tr>
                <td class="px-3" style="font-size:13px;">${m.tipo_mantenimiento || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${m.descripcion || '—'}</td>
                <td class="px-3" style="font-size:13px;">${fmtFecha(m.fecha_programada)}</td>
                <td class="px-3" style="font-size:13px;">${fmtFecha(m.fecha_realizada)}</td>
                <td class="px-3 text-end" style="font-size:13px;">
                    ${m.costo_mano_obra != null ? '$' + Number(m.costo_mano_obra).toLocaleString('es-MX') : '—'}
                </td>
                <td class="px-3 text-end" style="font-size:13px;">
                    ${m.costo_refacciones != null ? '$' + Number(m.costo_refacciones).toLocaleString('es-MX') : '—'}
                </td>
                <td class="px-3 text-center">${badgeEstadoGeneral(m.estado)}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="7" class="text-center py-5 text-muted">Sin mantenimientos registrados.</td></tr>`;

    // ════════════════════════════════════════════════
    // TAB: FALLAS
    // ════════════════════════════════════════════════
    const badgeSeveridad = (s) => {
        const map = {
            alta:  `<span class="badge bg-danger">Alta</span>`,
            media: `<span class="badge bg-warning text-dark">Media</span>`,
            baja:  `<span class="badge bg-success">Baja</span>`,
        };
        return map[s] || `<span class="badge bg-secondary">${s || '—'}</span>`;
    };

    document.getElementById('fallasBody').innerHTML = fallas.length
        ? fallas.map(f => `
            <tr>
                <td class="px-3" style="font-size:13px;">${f.descripcion || '—'}</td>
                <td class="px-3" style="font-size:13px;">${fmtFecha(f.fecha_reporte)}</td>
                <td class="px-3" style="font-size:13px;">${fmtFecha(f.fecha_resolucion)}</td>
                <td class="px-3 text-center">${badgeSeveridad(f.severidad)}</td>
                <td class="px-3 text-center">${badgeEstadoGeneral(f.estado)}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${f.reportado_por || '—'}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="6" class="text-center py-5 text-muted">Sin fallas registradas.</td></tr>`;

    // ════════════════════════════════════════════════
    // TAB: CHECKLIST
    // ════════════════════════════════════════════════
    const badgeChecklist = (r) => {
        const map = {
            aprobado: `<span class="badge bg-success">Aprobado</span>`,
            rechazado:`<span class="badge bg-danger">Rechazado</span>`,
            observado:`<span class="badge bg-warning text-dark">Observado</span>`,
        };
        return map[r] || `<span class="badge bg-secondary">${r || '—'}</span>`;
    };

    document.getElementById('checklistBody').innerHTML = checklist.length
        ? checklist.map(c => `
            <tr>
                <td class="px-3" style="font-size:13px;">${fmtFecha(c.fecha)}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${c.operador || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${c.turno || '—'}</td>
                <td class="px-3 text-center">${badgeChecklist(c.resultado_general)}</td>
                <td class="px-3 text-muted" style="font-size:12px;">${c.observaciones || '—'}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="5" class="text-center py-5 text-muted">Sin inspecciones registradas.</td></tr>`;


    // ════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════

    function fmtFecha(f) {
        if (!f) return '—';
        try {
            return new Date(f).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return f; }
    }

    function badgeEstadoOp(estado) {
        const map = {
            disponible:    `<span class="badge bg-success">Disponible</span>`,
            en_uso:        `<span class="badge bg-warning text-dark">En uso</span>`,
            mantenimiento: `<span class="badge bg-danger">Mantenimiento</span>`,
            revision:      `<span class="badge bg-secondary">Revisión</span>`,
            baja:          `<span class="badge bg-dark">Baja</span>`,
        };
        return map[estado] || `<span class="badge bg-light text-dark">${estado || '—'}</span>`;
    }

    function badgeEstadoGeneral(estado) {
        const map = {
            completado: `<span class="badge bg-success">Completado</span>`,
            pendiente:  `<span class="badge bg-warning text-dark">Pendiente</span>`,
            cancelado:  `<span class="badge bg-secondary">Cancelado</span>`,
            en_proceso: `<span class="badge bg-info text-dark">En proceso</span>`,
            resuelta:   `<span class="badge bg-success">Resuelta</span>`,
            cerrada:    `<span class="badge bg-dark">Cerrada</span>`,
        };
        return map[estado] || `<span class="badge bg-light text-dark">${estado || '—'}</span>`;
    }

}, 100);


// ════════════════════════════════════════════════
// CAMBIO DE TABS (fuera del setTimeout para que esté
// disponible desde los onclick del HTML)
// ════════════════════════════════════════════════

window.expTab = function (tab) {
    const tabs   = ['historial', 'uso', 'mantenimientos', 'fallas', 'checklist'];
    const panelPrefijo = 'panel-';
    const tabPrefijo   = 'tab-';

    tabs.forEach(t => {
        document.getElementById(panelPrefijo + t)?.classList.add('d-none');
        document.getElementById(tabPrefijo   + t)?.classList.remove('active');
    });

    document.getElementById(panelPrefijo + tab)?.classList.remove('d-none');
    document.getElementById(tabPrefijo   + tab)?.classList.add('active');
};