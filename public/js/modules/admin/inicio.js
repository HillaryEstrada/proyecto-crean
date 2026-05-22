// ============================================
// MÓDULO: public/js/modules/admin/inicio.js
// Dashboard CREAN — monocromático
// ============================================
(function () {

    function apiGet(url) {
        return fetch(url, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    function fmt(n) { return Number(n || 0).toLocaleString('es-MX'); }
    function el(id) { return document.getElementById(id); }

    function barra(label, count, pct, color) {
        return '<div class="st-item">' +
            '<div class="st-row"><span class="st-label">' + label + '</span><span class="st-count">' + (count || 0) + '</span></div>' +
            '<div class="st-track"><div class="st-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
        '</div>';
    }

    // ── Bienvenida ───────────────────────────
    var user = getCurrentUser();
    var elB = el('dash-bienvenida');
    if (user && elB) {
        var nombre = user.nombre || user.username || '';
        var hoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        var hoyFmt = hoy.charAt(0).toUpperCase() + hoy.slice(1);
        elB.innerHTML = '¡Hola, ' + nombre + '! &mdash; <span style="font-weight:400;color:#5A8AAE;font-size:1.1rem;">' + hoyFmt + '</span>';
    }

    // ── Alertas ──────────────────────────────
    function pintarAlertas() {
        var wrap = el('dash-alertas');
        if (!wrap) return;
        apiGet('/dashboard/alertas').then(function (data) {
            if (!data.length) {
                wrap.innerHTML = '<div class="dalert info"><i class="fa-solid fa-circle-check"></i><span>Sin alertas activas.</span></div>';
                return;
            }
            var iconMap = { critica:'fa-circle-exclamation', preventiva:'fa-clock', operativa:'fa-triangle-exclamation' };
            var clsMap  = { critica:'danger', preventiva:'warning', operativa:'info' };
            wrap.innerHTML = data.slice(0, 5).map(function(a) {
                return '<div class="dalert ' + (clsMap[a.categoria]||'info') + '">' +
                       '<i class="fa-solid ' + (iconMap[a.categoria]||'fa-bell') + '"></i>' +
                       '<span>' + a.mensaje + '</span></div>';
            }).join('');
        }).catch(function() { wrap.innerHTML = ''; });
    }

    // ── KPIs ─────────────────────────────────
    function pintarKPIs() {
        apiGet('/dashboard/kpis').then(function (d) {
            var c = el('dash-kpis');
            if (!c) return;
            c.innerHTML =
                '<div class="kpi-card"><div class="kpi-icon"><i class="fa-solid fa-tractor"></i></div>' +
                '<div><div class="kpi-label">Maquinaria activa</div><div class="kpi-val">' + fmt(d.maquinaria_total) + '</div>' +
                '<div class="kpi-sub">' + fmt(d.maquinaria_disponible) + ' disp. · ' + fmt(d.maquinaria_uso) + ' en uso</div></div></div>' +

                '<div class="kpi-card"><div class="kpi-icon"><i class="fa-solid fa-truck"></i></div>' +
                '<div><div class="kpi-label">Vehículos</div><div class="kpi-val">' + fmt(d.vehiculo_total) + '</div>' +
                '<div class="kpi-sub">' + fmt(d.vehiculo_disponible) + ' disp. · ' + fmt(d.vehiculo_uso) + ' prestados</div></div></div>' +

                '<div class="kpi-card"><div class="kpi-icon"><i class="fa-solid fa-building-wheat"></i></div>' +
                '<div><div class="kpi-label">Bodega granos</div>' +
                '<div class="kpi-val">' + fmt(d.bodega_stock_ton) + ' <span style="font-size:13px;font-weight:400;opacity:.5;">ton</span></div>' +
                '<div class="kpi-sub">' + fmt(d.bodegas_operativas) + ' bodegas operativas</div></div></div>' +

                '<div class="kpi-card"><div class="kpi-icon"><i class="fa-solid fa-users"></i></div>' +
                '<div><div class="kpi-label">Empleados activos</div><div class="kpi-val">' + fmt(d.empleados_activos) + '</div>' +
                '<div class="kpi-sub">' + fmt(d.contratos_por_vencer) + ' contratos por vencer</div></div></div>';
        }).catch(function(e) { console.error('KPIs:', e); });
    }

    // ── Actividad ────────────────────────────
    function pintarActividad() {
        var wrap = el('dash-actividad');
        if (!wrap) return;
        var dot = { entrada:'g', salida:'o', baja:'r', entrada_bodega:'b', salida_bodega:'o' };
        apiGet('/dashboard/actividad').then(function (data) {
            if (!data.length) { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">Sin movimientos recientes.</p>'; return; }
            wrap.innerHTML = data.slice(0, 5).map(function(m) {
                return '<div class="act-row">' +
                    '<div class="act-dot ' + (dot[m.tipo]||'b') + '"></div>' +
                    '<div><div class="act-tipo">' + m.tipo_label + '</div>' +
                    '<div class="act-desc">' + m.descripcion + '</div>' +
                    '<div class="act-meta">' + m.fecha_fmt + (m.responsable?' · '+m.responsable:'') + (m.referencia?' · '+m.referencia:'') + '</div></div>' +
                '</div>';
            }).join('');
        }).catch(function() { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">No se pudo cargar.</p>'; });
    }

    // ── Estado operativo ─────────────────────
    function pintarEstado() {
        var wrap = el('dash-estado');
        if (!wrap) return;
        apiGet('/dashboard/estado-operativo').then(function (d) {
            var tot = (d.disponible||0)+(d.en_uso||0)+(d.mantenimiento||0)+(d.baja||0);
            function pct(v) { return tot ? Math.round((v/tot)*100) : 0; }
            var mt = d.mob_total||0;
            function pM(v) { return mt ? Math.round((v/mt)*100) : 0; }
            wrap.innerHTML =
                '<div class="st-sec"><i class="fa-solid fa-tractor"></i> Maquinaria y Vehículos</div>' +
                barra('Disponible',        d.disponible,    pct(d.disponible),    '#16A34A') +
                barra('En uso / Prestado', d.en_uso,        pct(d.en_uso),        '#E67E22') +
                barra('Mantenimiento',     d.mantenimiento, pct(d.mantenimiento), '#B2382D') +
                barra('Baja',              d.baja,          pct(d.baja),          '#cbd5e0') +
                '<hr class="dash-hr">' +
                '<div class="st-sec"><i class="fa-solid fa-couch"></i> Mobiliario</div>' +
                barra('Disponible', d.mob_disponible, pM(d.mob_disponible), '#16A34A') +
                barra('Prestado',   d.mob_prestado,   pM(d.mob_prestado),   '#E67E22') +
                barra('Baja',       d.mob_baja,       pM(d.mob_baja),       '#cbd5e0');
        }).catch(function() { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">No se pudo cargar.</p>'; });
    }

    // ── Stock bajo ───────────────────────────
    function pintarStock() {
        var wrap = el('dash-stock');
        if (!wrap) return;
        apiGet('/dashboard/stock-bajo').then(function (data) {
            if (!data.length) {
                wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><span>Todo el stock está bien</span></div>';
                return;
            }
            wrap.innerHTML = data.slice(0, 6).map(function(a) {
                var cls = (a.stock <= 0) ? 'danger' : 'warning';
                return '<div class="list-row"><span class="list-name">' + a.nombre + '</span>' +
                       '<span class="dbadge ' + cls + '">' + fmt(a.stock) + ' ' + (a.unidad||'pz') + '</span></div>';
            }).join('');
        }).catch(function() { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">No se pudo cargar.</p>'; });
    }

    // ── Bodegas ──────────────────────────────
    function pintarBodegas() {
        var wrap = el('dash-bodegas');
        if (!wrap) return;
        var cls = { 'Operativo':'op', 'En mantenimiento':'mant', 'Inhabilitada':'inh' };
        apiGet('/dashboard/bodegas').then(function (data) {
            if (!data.length) { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">Sin bodegas registradas.</p>'; return; }
            wrap.innerHTML = data.slice(0, 5).map(function(b) {
                return '<div class="list-row"><span class="list-name">' + b.nombre + '</span>' +
                       '<span class="list-muted">' + (b.stock_ton ? fmt(b.stock_ton)+' ton' : '—') + '</span>' +
                       '<span class="dbadge ' + (cls[b.estado]||'op') + '">' + b.estado + '</span></div>';
            }).join('');
        }).catch(function() { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">No se pudo cargar.</p>'; });
    }

    // ── Contratos ────────────────────────────
    function pintarContratos() {
        var wrap = el('dash-contratos');
        if (!wrap) return;
        apiGet('/dashboard/contratos-alerta').then(function (data) {
            if (!data.length) {
                wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><span>Sin contratos por vencer</span></div>';
                return;
            }
            wrap.innerHTML = data.slice(0, 5).map(function(c) {
                var dias = Number(c.dias_restantes);
                var badge, label;
                if (dias < 0)        { badge='venc';    label='Vencido'; }
                else if (dias <= 30) { badge='venc';    label=dias+'d';  }
                else                 { badge='prox';    label=dias+'d';  }
                var ini = ((c.nombre||'').charAt(0)+(c.apellido||'').charAt(0)).toUpperCase();
                return '<div class="list-row"><div class="ct-av">' + ini + '</div>' +
                       '<span class="list-name">' + c.nombre + ' ' + c.apellido + '</span>' +
                       '<span class="dbadge ' + badge + '">' + label + '</span></div>';
            }).join('');
        }).catch(function() { wrap.innerHTML = '<p class="text-muted" style="font-size:12px;">No se pudo cargar.</p>'; });
    }

    // ── Arrancar ─────────────────────────────
    window._dashCargar = function () {
        pintarAlertas();
        pintarKPIs();
        pintarActividad();
        pintarEstado();
        pintarStock();
        pintarBodegas();
        pintarContratos();
    };

    window._dashCargar();

})();