// ============================================================
// expediente.js
// Módulo frontend del expediente de maquinaria — CREAN
// Consume la API real y renderiza todos los paneles
// ============================================================

'use strict';

/* ────────────────────────────────────────────────────────────
   CONFIGURACIÓN
──────────────────────────────────────────────────────────── */
const API_BASE = '/api'; // ajusta si tu prefijo es distinto

/* ────────────────────────────────────────────────────────────
   TOAST SYSTEM  (Bootstrap 5 Toasts — reemplaza SweetAlert)
──────────────────────────────────────────────────────────── */
const Toast = {
    _container: null,

    _getContainer() {
        if (!this._container) {
            this._container = document.getElementById('crean-toast-container');
        }
        return this._container;
    },

    show(message, type = 'success', duration = 4000) {
        const iconMap = {
            success: 'bi-check-circle-fill',
            danger:  'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info:    'bi-info-circle-fill'
        };
        const bgMap = {
            success: 'text-bg-success',
            danger:  'text-bg-danger',
            warning: 'text-bg-warning',
            info:    'text-bg-primary'
        };

        const id   = 'toast-' + Date.now();
        const icon = iconMap[type] || iconMap.info;
        const bg   = bgMap[type]   || bgMap.info;

        const el = document.createElement('div');
        el.id        = id;
        el.className = `toast align-items-center text-white border-0 ${bg}`;
        el.setAttribute('role', 'alert');
        el.setAttribute('aria-live', 'assertive');
        el.setAttribute('aria-atomic', 'true');
        el.innerHTML = `
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${icon}"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>`;

        this._getContainer().appendChild(el);
        const bsToast = new bootstrap.Toast(el, { delay: duration });
        bsToast.show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
    },

    success: (msg)        => Toast.show(msg, 'success'),
    error:   (msg)        => Toast.show(msg, 'danger',  5000),
    warning: (msg)        => Toast.show(msg, 'warning', 5000),
    info:    (msg)        => Toast.show(msg, 'info')
};

/* ────────────────────────────────────────────────────────────
   MODAL DE CONFIRMACIÓN  (Bootstrap Modal — reemplaza SweetAlert confirm)
──────────────────────────────────────────────────────────── */
const Confirm = {
    show({ title = '¿Estás seguro?', message = '', btnOk = 'Confirmar', btnCancel = 'Cancelar', type = 'warning' } = {}) {
        return new Promise(resolve => {
            const iconMap = {
                warning: 'bi-exclamation-triangle-fill text-warning',
                danger:  'bi-x-octagon-fill text-danger',
                info:    'bi-info-circle-fill text-primary',
                success: 'bi-check-circle-fill text-success'
            };
            const btnMap = {
                warning: 'btn-warning',
                danger:  'btn-danger',
                info:    'btn-primary',
                success: 'btn-success'
            };

            const id = 'confirm-modal-' + Date.now();
            const el = document.createElement('div');
            el.className = 'modal fade';
            el.id        = id;
            el.tabIndex  = -1;
            el.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content" style="border-radius:14px;border:none;box-shadow:0 20px 60px rgba(0,0,0,.2);">
                        <div class="modal-body text-center p-4">
                            <i class="bi ${iconMap[type] || iconMap.warning}" style="font-size:2.2rem;"></i>
                            <h6 class="fw-bold mt-3 mb-1">${title}</h6>
                            ${message ? `<p class="text-muted mb-0" style="font-size:13px;">${message}</p>` : ''}
                        </div>
                        <div class="modal-footer border-0 pt-0 justify-content-center gap-2">
                            <button class="btn btn-sm btn-secondary rounded-pill px-4" id="${id}-cancel">${btnCancel}</button>
                            <button class="btn btn-sm ${btnMap[type] || btnMap.warning} rounded-pill px-4" id="${id}-ok">${btnOk}</button>
                        </div>
                    </div>
                </div>`;

            document.body.appendChild(el);
            const modal = new bootstrap.Modal(el);
            modal.show();

            el.querySelector(`#${id}-ok`).addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });
            el.querySelector(`#${id}-cancel`).addEventListener('click', () => {
                modal.hide();
                resolve(false);
            });
            el.addEventListener('hidden.bs.modal', () => {
                el.remove();
                resolve(false);
            });
        });
    }
};

/* ────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */
const ms   = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fmtF = s => { if (!s) return '—'; const [y, m, d] = s.split('T')[0].split('-'); return `${+d} ${ms[+m-1]} ${y}`; };
const fmtN = n  => Number(n || 0).toLocaleString('es-MX');
const fmtM = n  => '$' + Number(n || 0).toLocaleString('es-MX');

function opBadge(op) {
    const m = {
        disponible:    `<span class="badge-disponible"><span class="dot dot-green"></span>Disponible</span>`,
        en_uso:        `<span class="badge-uso"><span class="dot dot-orange"></span>En uso</span>`,
        mantenimiento: `<span class="badge-mant"><span class="dot dot-red"></span>Mantenimiento</span>`,
        revision:      `<span class="badge-revision"><span class="dot dot-gray"></span>Revisión</span>`
    };
    return m[op] || op;
}

function efBadge(e) {
    return { bueno: '<span class="b-ok">Bueno</span>', regular: '<span class="b-warn">Regular</span>', malo: '<span class="b-err">Malo</span>' }[e] || e;
}

function priBadge(p) {
    return { alta: '<span class="b-err">Alta</span>', media: '<span class="b-warn">Media</span>', baja: '<span class="b-gray">Baja</span>' }[p] || p;
}

function estFBadge(e) {
    return {
        pendiente:  '<span class="b-gray">Pendiente</span>',
        en_proceso: '<span class="b-warn">En proceso</span>',
        resuelta:   '<span class="b-ok">Resuelta</span>'
    }[e] || e;
}

function estMantBadge(e) {
    return {
        finalizado:  '<span class="b-ok">Finalizado</span>',
        en_proceso:  '<span class="b-warn">En proceso</span>'
    }[e] || e;
}

/* Iconos por tipo de evento */
const tlIcono = {
    alta:          'bi-plus-circle-fill',
    cambio_estado: 'bi-arrow-repeat',
    cambio_ubicacion: 'bi-geo-alt-fill',
    registro_horas: 'bi-stopwatch-fill',
    mantenimiento:  'bi-wrench-adjustable',
    falla:          'bi-exclamation-circle-fill',
    baja:           'bi-archive-fill'
};

/* ────────────────────────────────────────────────────────────
   API CALLS
──────────────────────────────────────────────────────────── */
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
}

async function cargarExpediente(id) {
    return apiFetch(`${API_BASE}/expediente/maquinaria/${id}`);
}

async function cargarAlertas(id) {
    return apiFetch(`${API_BASE}/alertas/maquinaria/${id}`);
}

async function marcarAlertaLeida(alertaId) {
    return apiFetch(`${API_BASE}/alertas/${alertaId}/leida`, { method: 'PATCH' });
}

/* ────────────────────────────────────────────────────────────
   RENDER: ALERTAS
──────────────────────────────────────────────────────────── */
function renderAlertas(alertas) {
    const container  = document.getElementById('alertas-container');
    const body       = document.getElementById('alertas-body');
    const countBadge = document.getElementById('alertas-count');

    if (!alertas || alertas.length === 0) {
        container.style.display = 'none';
        return;
    }

    /* Ordenar: prioridad ASC, fecha_generada DESC */
    const sorted = [...alertas].sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
        return new Date(b.fecha_generada) - new Date(a.fecha_generada);
    });

    /* Solo las no leídas en el panel visible */
    const noLeidas = sorted.filter(a => !a.leida);

    if (noLeidas.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    countBadge.textContent  = noLeidas.length + ' alerta' + (noLeidas.length > 1 ? 's' : '');

    const claseMap  = { 1: 'danger',  2: 'warning', 3: 'info' };
    const iconoMap  = {
        1: 'bi-x-octagon-fill',
        2: 'bi-exclamation-triangle-fill',
        3: 'bi-info-circle-fill'
    };

    body.innerHTML = noLeidas.map(a => `
        <div class="alerta-strip ${claseMap[a.prioridad] || 'info'}" id="alerta-${a.pk_alerta}">
            <i class="bi ${iconoMap[a.prioridad] || 'bi-info-circle-fill'}" style="font-size:15px;flex-shrink:0;margin-top:1px;"></i>
            <div class="flex-grow-1">
                <div class="a-title">${a.mensaje}</div>
                ${a.fecha_evento
                    ? `<div class="a-sub"><i class="bi bi-calendar3 me-1"></i>Fecha del evento: ${fmtF(a.fecha_evento)}</div>`
                    : ''}
                <div class="a-sub" style="opacity:.55;font-size:10.5px;">
                    <i class="bi bi-clock me-1"></i>${fmtF(a.fecha_generada)}
                    · <span class="badge rounded-pill" style="font-size:9px;background:rgba(0,0,0,.12);">${a.tipo_alerta}</span>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-light rounded-pill"
                    style="font-size:11px;font-weight:700;white-space:nowrap;flex-shrink:0;"
                    onclick="accionMarcarLeida(${a.pk_alerta})">
                <i class="bi bi-check2 me-1"></i>Leída
            </button>
        </div>`).join('');
}

/* ────────────────────────────────────────────────────────────
   ACCIÓN: Marcar alerta como leída (llamada desde HTML)
──────────────────────────────────────────────────────────── */
window.accionMarcarLeida = async function(alertaId) {
    try {
        await marcarAlertaLeida(alertaId);
        /* Animar y eliminar del DOM */
        const el = document.getElementById('alerta-' + alertaId);
        if (el) {
            el.style.transition = 'opacity .3s, transform .3s';
            el.style.opacity    = '0';
            el.style.transform  = 'translateX(20px)';
            setTimeout(() => {
                el.remove();
                /* Si ya no hay alertas en el body, ocultar sección */
                const remaining = document.querySelectorAll('#alertas-body .alerta-strip').length;
                if (remaining === 0) {
                    document.getElementById('alertas-container').style.display = 'none';
                } else {
                    const badge = document.getElementById('alertas-count');
                    badge.textContent = remaining + ' alerta' + (remaining > 1 ? 's' : '');
                }
            }, 320);
        }
        Toast.success('Alerta marcada como leída');
    } catch (err) {
        Toast.error('No se pudo marcar la alerta: ' + err.message);
    }
};

/* ────────────────────────────────────────────────────────────
   RENDER: HEADER + STATS
──────────────────────────────────────────────────────────── */
function renderHeader(info, mantenimiento = [], fallas = []) {
    document.getElementById('bc-eco').textContent = info.numero_economico || '—';
    document.title = `CREAN · Expediente ${info.numero_economico || ''}`;

    /* Subtipo */
    const subtipo = document.getElementById('h-subtipo');
    if (subtipo) subtipo.textContent = [info.marca, info.modelo, info.anio].filter(Boolean).join(' · ');

    /* Pills */
    const pills = document.getElementById('h-pills');
    const opClass = { disponible: 'verde', en_uso: 'naranja', mantenimiento: 'rojo', revision: 'gris', baja: 'gris' };
    const opLabel = { disponible: 'Disponible', en_uso: 'En uso', mantenimiento: 'Mantenimiento', revision: 'Revisión', baja: 'Baja' };
    const efLabel = { bueno: 'Estado físico: Bueno', regular: 'Estado físico: Regular', malo: 'Estado físico: Malo' };
    const efClass = { bueno: 'verde', regular: 'naranja', malo: 'rojo' };

    if (pills) {
        pills.innerHTML = `
            <span class="exp-pill ${opClass[info.estado_operativo] || ''}">
                <i class="bi bi-circle-fill" style="font-size:7px;"></i>
                ${opLabel[info.estado_operativo] || info.estado_operativo}
            </span>
            <span class="exp-pill ${efClass[info.estado_fisico] || 'gris'}">
                <i class="bi bi-shield-check"></i>
                ${efLabel[info.estado_fisico] || info.estado_fisico}
            </span>
            ${info.tipo_nombre ? `<span class="exp-pill"><i class="bi bi-tag-fill"></i>${info.tipo_nombre}</span>` : ''}
            ${info.ubicacion_nombre ? `<span class="exp-pill"><i class="bi bi-geo-alt-fill"></i>${info.ubicacion_nombre}</span>` : ''}`;
    }

    /* Fecha */
    const hFecha = document.getElementById('h-fecha');
    if (hFecha) hFecha.textContent = 'Alta: ' + fmtF(info.fecha_registro);

    /* Stats */
    const costoTotal = mantenimiento.reduce((s, m) => s + parseFloat(m.costo_mano_obra || 0), 0);
    const fallasActivas = fallas.filter(f => f.estado !== 'resuelta').length;

    const stats = [
        { val: `${fmtN(info.horas_actuales)}<small style="font-size:.68rem;font-weight:400"> hrs</small>`, lbl: 'Horas totales', icon: 'bi-speedometer2', bg: '#dbeaf8', color: 'var(--crean-secondary)' },
        { val: `${fmtN(info.combustible_litros)}<small style="font-size:.68rem;font-weight:400"> L</small>`, lbl: 'Combustible actual', icon: 'bi-droplet-fill', bg: '#fef3e2', color: 'var(--crean-warning)' },
        { val: mantenimiento.length, lbl: 'Mantenimientos', icon: 'bi-wrench-adjustable', bg: '#f0f4f8', color: 'var(--crean-muted)' },
        { val: `<span style="color:${fallasActivas > 0 ? 'var(--crean-danger)' : 'inherit'}">${fallas.length}</span>`, lbl: 'Fallas registradas', icon: 'bi-exclamation-triangle-fill', bg: '#fdecea', color: 'var(--crean-danger)' },
        { val: fmtM(costoTotal), lbl: 'Costo total mant.', icon: 'bi-coin', bg: '#e6f4e6', color: 'var(--crean-success)' }
    ];

    document.getElementById('stat-row').innerHTML = stats.map(s => `
        <div class="col-6 col-md-4 col-lg-2">
            <div class="exp-stat">
                <div class="exp-stat-icon" style="background:${s.bg};color:${s.color};">
                    <i class="bi ${s.icon}"></i>
                </div>
                <div>
                    <div class="exp-stat-val">${s.val}</div>
                    <div class="exp-stat-lbl">${s.lbl}</div>
                </div>
            </div>
        </div>`).join('');
}

/* ────────────────────────────────────────────────────────────
   RENDER: RESUMEN (info general, factura, garantía)
──────────────────────────────────────────────────────────── */
function renderResumen(info, factura, garantia) {
    const infoRows = [
        { l: 'Número económico', v: `<span class="eco-num">${info.numero_economico || '—'}</span>` },
        { l: 'N° Inventario SEDER', v: info.numero_inventario_seder || '—' },
        { l: 'Tipo de equipo',  v: info.tipo_nombre     || '—' },
        { l: 'Marca',           v: info.marca           || '—' },
        { l: 'Modelo',          v: info.modelo          || '—' },
        { l: 'Año',             v: info.anio            || '—' },
        { l: 'Color',           v: info.color           || '—' },
        { l: 'Serie',           v: info.serie           || '—' },
        { l: 'Estado operativo',v: opBadge(info.estado_operativo) },
        { l: 'Estado físico',   v: efBadge(info.estado_fisico) },
        { l: 'Ubicación actual',v: info.ubicacion_nombre || '—' },
        { l: 'Registrado por',  v: info.registrado_por_usuario || '—' },
        { l: 'Fecha de alta',   v: fmtF(info.fecha_registro) }
    ];
    document.getElementById('res-info').innerHTML = infoRows.map(r =>
        `<div class="info-item"><div class="lbl">${r.l}</div><div class="val">${r.v}</div></div>`
    ).join('');

    /* Factura */
    document.getElementById('res-factura').innerHTML = factura && factura.numero_factura ? `
        <div class="info-grid">
            <div class="info-item">
                <div class="lbl">N° Factura</div>
                <div class="val"><span class="eco-num">${factura.numero_factura}</span></div>
            </div>
            <div class="info-item">
                <div class="lbl">Fecha</div>
                <div class="val">${fmtF(factura.fecha_factura)}</div>
            </div>
            <div class="info-item">
                <div class="lbl">Costo de adquisición</div>
                <div class="val" style="color:var(--crean-success);font-size:1rem;font-weight:800;">${fmtM(factura.costo_adquisicion)}</div>
            </div>
        </div>
        ${factura.pdf_factura ? `
        <div class="mt-3">
            <a href="${factura.pdf_factura}" target="_blank" class="btn btn-sm"
               style="background:#f5f8fc;border:1.5px solid var(--crean-border);color:var(--crean-primary);border-radius:8px;font-size:12px;font-weight:600;">
                <i class="bi bi-file-pdf-fill me-1" style="color:#c0392b;"></i>Ver PDF factura
            </a>
        </div>` : ''}` :
        `<div class="empty-panel" style="padding:18px;"><i class="bi bi-file-earmark-x" style="font-size:2rem;opacity:.3;display:block;margin-bottom:8px;"></i><p style="font-size:13px;color:var(--crean-muted);">Sin factura registrada.</p></div>`;

    /* Garantía */
    const vigente = garantia && garantia.fecha_fin && new Date(garantia.fecha_fin) >= new Date();
    document.getElementById('res-garantia').innerHTML = garantia && garantia.fecha_fin ? `
        <div class="info-grid">
            <div class="info-item">
                <div class="lbl">Fecha inicio</div>
                <div class="val">${fmtF(garantia.fecha_inicio)}</div>
            </div>
            <div class="info-item">
                <div class="lbl">Fecha fin</div>
                <div class="val" style="color:${vigente ? 'var(--crean-success)' : 'var(--crean-danger)'};">
                    ${fmtF(garantia.fecha_fin)}
                    <i class="bi ${vigente ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ms-1"></i>
                </div>
            </div>
            ${garantia.limite_horas ? `<div class="info-item"><div class="lbl">Límite horas</div><div class="val">${fmtN(garantia.limite_horas)} hrs</div></div>` : ''}
            ${garantia.limite_km    ? `<div class="info-item"><div class="lbl">Límite km</div><div class="val">${fmtN(garantia.limite_km)} km</div></div>`    : ''}
        </div>
        ${garantia.garantia_pdf ? `
        <div class="mt-3">
            <a href="${garantia.garantia_pdf}" target="_blank" class="btn btn-sm"
               style="background:#f5f8fc;border:1.5px solid var(--crean-border);color:var(--crean-primary);border-radius:8px;font-size:12px;font-weight:600;">
                <i class="bi bi-file-pdf-fill me-1" style="color:#c0392b;"></i>Ver PDF garantía
            </a>
        </div>` : ''}` :
        `<div class="empty-panel" style="padding:18px;"><i class="bi bi-shield-x" style="font-size:2rem;opacity:.3;display:block;margin-bottom:8px;"></i><p style="font-size:13px;color:var(--crean-muted);">Sin garantía registrada.</p></div>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER: HISTORIAL (timeline + ubicaciones)
──────────────────────────────────────────────────────────── */
function renderHistorial(eventos, ubicaciones) {
    /* Timeline */
    const tlCont  = document.getElementById('tl-container');
    const tlCount = document.getElementById('tl-count');
    tlCount.textContent = (eventos.length) + ' eventos';

    const dotsClase = {
        alta:             'alta',
        cambio_estado:    'uso',
        cambio_ubicacion: 'ubicacion',
        registro_horas:   'uso',
        mantenimiento:    'mant',
        falla:            'falla',
        baja:             'falla'
    };

    tlCont.innerHTML = eventos.length ? eventos.map(e => `
        <div class="tl-item">
            <div class="tl-dot ${dotsClase[e.tipo_evento] || 'uso'}">
                <i class="bi ${tlIcono[e.tipo_evento] || 'bi-circle-fill'}" style="font-size:10px;"></i>
            </div>
            <div class="tl-card">
                <div class="tl-fecha"><i class="bi bi-calendar3 me-1"></i>${fmtF(e.fecha_registro)}</div>
                <div class="tl-titulo">${e.tipo_evento.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <p class="tl-desc">${e.descripcion || '—'}</p>
                ${e.registrado_por_usuario ? `<div class="tl-fecha"><i class="bi bi-person-fill me-1"></i>${e.registrado_por_usuario}</div>` : ''}
            </div>
        </div>`).join('') :
        `<div class="empty-panel"><i class="bi bi-clock-history" style="font-size:2.2rem;opacity:.3;display:block;margin-bottom:10px;"></i><p style="font-size:13px;">Sin eventos registrados.</p></div>`;

    /* Ubicaciones */
    const ubCont  = document.getElementById('ub-container');
    const ubCount = document.getElementById('ub-count');
    ubCount.textContent = ubicaciones.length + ' movimiento' + (ubicaciones.length !== 1 ? 's' : '');

    ubCont.innerHTML = ubicaciones.length ? ubicaciones.map((u, i) => `
        <div class="ub-item">
            <div class="ub-dot ${i === 0 ? 'actual' : ''}">
                <i class="bi ${i === 0 ? 'bi-geo-alt-fill' : 'bi-circle-fill'}" style="font-size:${i === 0 ? '8' : '5'}px;"></i>
            </div>
            <div class="ub-card">
                <div class="ub-fecha">
                    ${i === 0 ? '<span style="background:#e6f4e6;color:var(--crean-success);font-weight:700;padding:1px 6px;border-radius:8px;font-size:9px;margin-right:4px;">ACTUAL</span>' : ''}
                    <i class="bi bi-calendar3 me-1"></i>${fmtF(u.fecha_registro)}
                </div>
                <div class="ub-lugar">
                    <i class="bi bi-pin-map-fill me-1" style="font-size:10px;color:var(--crean-secondary);"></i>
                    ${u.ubicacion_nueva || '—'}
                </div>
                ${u.ubicacion_anterior ? `<div class="ub-motivo"><i class="bi bi-arrow-left me-1"></i>Antes: ${u.ubicacion_anterior}</div>` : ''}
                ${u.motivo ? `<div class="ub-motivo">${u.motivo}</div>` : ''}
                ${u.registrado_por_usuario ? `<div class="ub-motivo"><i class="bi bi-person me-1"></i>${u.registrado_por_usuario}</div>` : ''}
            </div>
        </div>`).join('') :
        `<div class="empty-panel" style="padding:20px;"><i class="bi bi-geo-alt" style="font-size:2rem;opacity:.3;display:block;margin-bottom:8px;"></i><p style="font-size:13px;color:var(--crean-muted);">Sin historial de ubicación.</p></div>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER: USO (tabla de horas)
──────────────────────────────────────────────────────────── */
function renderUso(uso) {
    const totH = uso.reduce((s, u) => s + (parseInt(u.horas) || 0), 0);
    const totD = uso.reduce((s, u) => s + parseFloat(u.combustible_litros || 0), 0);

    document.getElementById('uso-footer').textContent = `${uso.length} registro(s)`;
    document.getElementById('uso-tot-h').textContent  = fmtN(totH);
    document.getElementById('uso-tot-d').textContent  = fmtN(totD);

    document.getElementById('uso-tbody').innerHTML = uso.length ? uso.map(u => `
        <tr>
            <td style="white-space:nowrap;"><i class="bi bi-calendar3 me-1 text-muted"></i>${fmtF(u.fecha_registro)}</td>
            <td class="text-center"><strong style="font-family:'DM Mono',monospace;">${u.horas}</strong> hrs</td>
            <td class="text-center" style="font-family:'DM Mono',monospace;">${u.combustible_litros > 0 ? u.combustible_litros + ' L' : '—'}</td>
            <td>${u.registrado_por_usuario || '—'}</td>
            <td>${u.actividad_realizada || '—'}</td>
            <td style="color:var(--crean-muted);font-size:12px;">${u.ubicacion_nombre || '—'}</td>
            <td style="font-size:12px;color:var(--crean-muted);">${u.observaciones || '—'}</td>
        </tr>`).join('') :
        `<tr><td colspan="7" class="text-center py-4" style="color:var(--crean-muted);"><i class="bi bi-inbox me-2"></i>Sin registros de uso.</td></tr>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER: CHECKLIST
──────────────────────────────────────────────────────────── */
function renderChecklist(checklist) {
    const campos = [
        { key: 'nivel_aceite',       lbl: 'Nivel de aceite' },
        { key: 'nivel_refrigerante', lbl: 'Nivel de refrigerante' },
        { key: 'filtro_aire',        lbl: 'Filtro de aire' },
        { key: 'presion_llantas',    lbl: 'Presión de llantas' },
        { key: 'nivel_combustible',  lbl: 'Nivel de combustible' },
        { key: 'engrase_puntos',     lbl: 'Engrase de puntos' },
        { key: 'inspeccion_visual',  lbl: 'Inspección visual' }
    ];

    document.getElementById('ck-container').innerHTML = checklist.length ? checklist.map(ck => {
        const ok  = campos.filter(c => ck[c.key]).length;
        const pct = Math.round(ok / campos.length * 100);
        return `<div class="col-md-6 col-xl-4">
            <div class="ck-card">
                <div class="ck-head" style="background:var(--crean-secondary);">
                    <i class="bi bi-clipboard2-check-fill me-2"></i>Checklist — ${fmtF(ck.fecha)}
                </div>
                <div class="ck-meta">
                    <i class="bi bi-person me-1"></i>${ck.realizado_por_usuario || '—'} ·
                    <strong>${ok}/${campos.length}</strong> ítems ✓ ·
                    <span style="color:${pct >= 80 ? 'var(--crean-success)' : 'var(--crean-danger)'};">${pct}%</span>
                </div>
                ${campos.map(c => `
                    <div class="ck-row ${ck[c.key] ? '' : 'fail'}">
                        <i class="bi ${ck[c.key] ? 'bi-check-circle-fill ck-ok' : 'bi-x-circle-fill ck-fail'}"></i>
                        <span>${c.lbl}</span>
                    </div>`).join('')}
                ${ck.observaciones ? `<div class="ck-meta pb-2"><i class="bi bi-chat-text me-1"></i>${ck.observaciones}</div>` : ''}
            </div>
        </div>`;
    }).join('') :
    `<div class="col"><div class="empty-panel"><i class="bi bi-clipboard2-x" style="font-size:2.2rem;opacity:.3;display:block;margin-bottom:10px;"></i><p style="font-size:13px;">Sin checklists registrados.</p></div></div>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER: FALLAS
──────────────────────────────────────────────────────────── */
function renderFallas(fallas) {
    document.getElementById('fallas-footer').textContent = `${fallas.length} falla(s)`;
    document.getElementById('fallas-tbody').innerHTML = fallas.length ? fallas.map((f, i) => `
        <tr>
            <td style="color:var(--crean-muted);font-size:12px;">${i + 1}</td>
            <td>${f.descripcion}</td>
            <td style="white-space:nowrap;"><i class="bi bi-calendar3 me-1 text-muted"></i>${fmtF(f.fecha_reporte)}</td>
            <td>${estFBadge(f.estado)}</td>
            <td style="white-space:nowrap;">${fmtF(f.fecha_resolucion)}</td>
            <td style="font-size:12px;color:var(--crean-muted);">${f.accion_tomada || '—'}</td>
            <td style="font-size:12px;color:var(--crean-muted);">${f.reportado_por_usuario || '—'}</td>
        </tr>`).join('') :
        `<tr><td colspan="7" class="text-center py-4" style="color:var(--crean-muted);"><i class="bi bi-inbox me-2"></i>Sin fallas registradas.</td></tr>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER: MANTENIMIENTO
──────────────────────────────────────────────────────────── */
function renderMantenimiento(mant) {
    const costoTotal = mant.reduce((s, m) => s + parseFloat(m.costo_mano_obra || 0), 0);
    document.getElementById('mant-footer').textContent = `${mant.length} mantenimiento(s)`;
    document.getElementById('mant-costo').textContent  = fmtM(costoTotal);

    document.getElementById('mant-tbody').innerHTML = mant.length ? mant.map((m, i) => `
        <tr>
            <td style="color:var(--crean-muted);font-size:12px;">${i + 1}</td>
            <td>${m.tipo_mantenimiento === 'preventivo' ? '<span class="b-prev"><i class="bi bi-shield-check me-1"></i>Preventivo</span>' : '<span class="b-corr"><i class="bi bi-tools me-1"></i>Correctivo</span>'}</td>
            <td>${m.tipo_servicio_nombre || '—'}</td>
            <td style="white-space:nowrap;"><i class="bi bi-calendar3 me-1 text-muted"></i>${fmtF(m.fecha_servicio)}</td>
            <td class="text-center" style="font-family:'DM Mono',monospace;"><strong>${fmtN(m.horas_maquina)}</strong> hrs</td>
            <td style="font-size:12px;">${m.empleado_nombre ? m.empleado_nombre + ' ' + (m.empleado_apellido || '') : m.proveedor_nombre || '—'}</td>
            <td class="text-center" style="font-weight:700;color:var(--crean-primary);">${fmtM(m.costo_mano_obra)}</td>
            <td style="font-size:12px;color:var(--crean-muted);">
                ${m.proximo_mantenimiento_fecha ? `<i class="bi bi-calendar-check me-1"></i>${fmtF(m.proximo_mantenimiento_fecha)}` : ''}
                ${m.proximo_mantenimiento_horas ? `<br><i class="bi bi-speedometer2 me-1"></i>${fmtN(m.proximo_mantenimiento_horas)} hrs` : ''}
                ${!m.proximo_mantenimiento_fecha && !m.proximo_mantenimiento_horas ? '—' : ''}
            </td>
            <td>${estMantBadge(m.estado_mantenimiento)}</td>
        </tr>`).join('') :
        `<tr><td colspan="9" class="text-center py-4" style="color:var(--crean-muted);"><i class="bi bi-inbox me-2"></i>Sin mantenimientos registrados.</td></tr>`;
}

/* ────────────────────────────────────────────────────────────
   RENDER PRINCIPAL — orquesta todo
──────────────────────────────────────────────────────────── */
async function renderExpediente(id) {
    if (!id) {
        mostrarNotFound(id);
        return;
    }

    /* Spinner de carga */
    document.getElementById('panel-expediente').style.display = 'none';
    document.getElementById('panel-notfound').style.display   = 'none';

    try {
        /* Carga en paralelo: expediente + alertas */
        const [data, alertas] = await Promise.all([
            cargarExpediente(id),
            cargarAlertas(id).catch(() => [])
        ]);

        /* Mostrar panel */
        document.getElementById('panel-expediente').style.display = 'block';

        /* Renderizar secciones */
        renderHeader(data.info, data.mantenimiento, data.fallas);
        renderAlertas(alertas);
        renderResumen(data.info, data.factura, data.garantia);
        renderHistorial(data.historial, data.ubicaciones);
        renderUso(data.uso);
        renderChecklist(data.checklist);
        renderFallas(data.fallas);
        renderMantenimiento(data.mantenimiento);

        /* Reset al tab Resumen */
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.crean-tab').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-resumen').classList.add('active');
        document.querySelector('.crean-tab').classList.add('active');

    } catch (err) {
        if (err.message.includes('404') || err.message.toLowerCase().includes('no encontrada')) {
            mostrarNotFound(id);
        } else {
            Toast.error('Error al cargar el expediente: ' + err.message);
            console.error('[expediente]', err);
        }
    }
}

function mostrarNotFound(id) {
    document.getElementById('panel-expediente').style.display = 'none';
    document.getElementById('panel-notfound').style.display   = 'block';
    const nfId = document.getElementById('nf-id');
    if (nfId) nfId.textContent = id || '(vacío)';
    document.title = 'CREAN · Expediente no encontrado';
}

/* ────────────────────────────────────────────────────────────
   TABS
──────────────────────────────────────────────────────────── */
window.switchTab = function(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.crean-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');
};

/* ────────────────────────────────────────────────────────────
   NAVEGACIÓN (para Demo switcher o links externos)
──────────────────────────────────────────────────────────── */
window.navegarA = function(id) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    renderExpediente(id);
};

/* ────────────────────────────────────────────────────────────
   INIT — lee ?id= de la URL
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const urlId = new URLSearchParams(window.location.search).get('id');
    renderExpediente(urlId);
});