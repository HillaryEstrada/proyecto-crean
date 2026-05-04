// ============================================
// MÓDULO: consumible.js
// ============================================

(function () {

    let _articulos         = [];
    let _articulosInactivos = [];
    let _movimientos       = [];
    let _unidades          = [];
    let _almacenes         = [];
    let _partidas          = [];
    let _areas             = [];
    let _empleados         = [];
    let _usuarios          = [];
    let _idDesactivar      = null;

    esperarElemento('articuloBody', async () => {
        await cargarCatalogos();
        await listarArticulos();
        await cargarStockBajo();
        switchTabPrincipal('movimientos');
    }, 20, 'consumible/consumible');

    // ════════════════════════════════════════
    // CATÁLOGOS
    // ════════════════════════════════════════
    async function cargarCatalogos() {
        const cargar = async (url) => {
            try { const d = await fetchWithAuth(url); return Array.isArray(d) ? d : []; }
            catch (e) { console.error(`Error ${url}:`, e); return []; }
        };
        _unidades  = await cargar('/unidad-medida');
        _almacenes = await cargar('/almacen');
        _partidas  = await cargar('/partida-presupuestal');
        _areas     = await cargar('/area');
        _empleados = await cargar('/empleados');
        _usuarios  = await cargar('/users');

        llenarSelect('f_fk_unidad',     _unidades,  'pk_unidad',   'nombre');
        llenarSelect('f_fk_almacen',    _almacenes, 'pk_almacen',  'nombre');
        llenarSelect('f_fk_partida',    _partidas,  'clave',       'nombre');
        llenarSelect('f_fk_area',       _areas,     'pk_area',     'nombre');
        llenarSelect('f_recibido_por',  _empleados, 'pk_empleado', e => `${e.nombre} ${e.apellido_paterno}`);
        llenarSelect('bc_fk_partida',   _partidas,  'clave',       'nombre');
    }


    // ════════════════════════════════════════
    // LISTAR ARTÍCULOS ACTIVOS
    // ════════════════════════════════════════
    async function listarArticulos() {
        const tabla = document.getElementById('articuloBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/articulos');
            _articulos = Array.isArray(data) ? data : [];
            renderTarjetasArticulos(_articulos);
            renderTablaArticulos(_articulos);
            llenarSelect('f_fk_articulo', _articulos, 'pk_articulo', 'nombre');
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los artículos' });
        }
    }

    async function cargarStockBajo() {
        try {
            const data = await fetchWithAuth('/articulos/stock-bajo');
            const alerta = document.getElementById('alertaStockBajo');
            if (!alerta) return;
            if (data.length) {
                document.getElementById('listaStockBajo').textContent =
                    data.map(a => `${a.nombre} (${a.stock} ${a.unidad || ''})`).join(' · ');
                alerta.classList.remove('d-none');
            } else {
                alerta.classList.add('d-none');
            }
        } catch (e) { /* silencioso */ }
    }

    // ════════════════════════════════════════
    // TARJETAS
    // ════════════════════════════════════════
    function renderTarjetasArticulos(data) {
        const cont = document.getElementById('tarjetasArticulos');
        if (!cont) return;
        const total    = data.length;
        const ok       = data.filter(a => a.estado_stock === 'ok').length;
        const bajo     = data.filter(a => a.estado_stock === 'bajo').length;
        const sinStock = data.filter(a => a.estado_stock === 'sin_stock').length;
        cont.innerHTML = `
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Artículos</div>
                <div class="fw-bold" style="font-size:28px;color:#1a3c5e;">${total}</div>
                <div class="text-muted" style="font-size:11px;">Registrados activos</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Stock lleno</div>
                <div class="fw-bold" style="font-size:24px;color:#2d7a4f;">${ok}</div>
                <div class="text-muted" style="font-size:11px;">artículo${ok !== 1 ? 's' : ''} en nivel óptimo</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Stock Bajo</div>
                <div class="fw-bold" style="font-size:24px;color:#e6a817;">${bajo}</div>
                <div class="text-muted" style="font-size:11px;">artículo${bajo !== 1 ? 's' : ''} bajo mínimo</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Sin Stock</div>
                <div class="fw-bold" style="font-size:24px;color:#c0392b;">${sinStock}</div>
                <div class="text-muted" style="font-size:11px;">artículo${sinStock !== 1 ? 's' : ''} agotado${sinStock !== 1 ? 's' : ''}</div>
            </div></div></div>`;
    }

    // ════════════════════════════════════════
    // RENDER TABLA ACTIVOS
    // ════════════════════════════════════════
    function renderTablaArticulos(data) {
        const tabla = document.getElementById('articuloBody');
        const info  = document.getElementById('info-registros-art');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">
                <i class="fa-solid fa-boxes-stacked fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay artículos registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'articuloBody', filasPorPagina: 10, sufijo: 'art' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_articulos.length} registros`;

        tabla.innerHTML = data.map((a, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${a.nombre}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.categoria || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.unidad || '—'}</td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;color:${colorStock(a.estado_stock)};">${a.stock}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${a.stock_minimo}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.almacen || '—'}</td>
                <td class="px-3 text-center">${badgeEstado(a.estado_stock)}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Registrar movimiento"
                        onclick="abrirFormularioMovimientoRapido(${a.pk_articulo})">
                        <i class="fa-solid fa-arrow-right-arrow-left" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarArticulo(${a.pk_articulo})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" title="Historial"
                        onclick="verHistorialArticulo(${a.pk_articulo}, '${(a.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'articuloBody', filasPorPagina: 10, sufijo: 'art' });
    }

    function colorStock(estado) {
        if (estado === 'sin_stock') return '#c0392b';
        if (estado === 'bajo')      return '#e6a817';
        return '#2d7a4f';
    }

    function badgeEstado(estado) {
        if (estado === 'sin_stock') return `<span class="badge" style="background:#c0392b;font-size:11px;">Sin stock</span>`;
        if (estado === 'bajo')      return `<span class="badge bg-warning text-dark" style="font-size:11px;">Bajo</span>`;
        return `<span class="badge" style="background:#2d7a4f;font-size:11px;">Stock lleno</span>`;
    }

    window.filtrarTabla = function () {
    const q         = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const estado    = document.getElementById('filtroEstado')?.value || '';
    renderTablaArticulos(_articulos.filter(a => {
        const txt = `${a.nombre} ${a.almacen || ''} ${a.codigo_barras || ''}`.toLowerCase();
        return (!q || txt.includes(q)) && (!categoria || a.categoria === categoria) && (!estado || a.estado_stock === estado);
    }));
    };

    // ════════════════════════════════════════
    // LISTAR INACTIVOS
    // ════════════════════════════════════════
    async function listarInactivos() {
        const tabla = document.getElementById('articuloBodyInactivos');
        const info  = document.getElementById('info-registros-art-inactivos');
        if (!tabla) return;
        tabla.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data = await fetchWithAuth('/articulos/inactivos');
            _articulosInactivos = Array.isArray(data) ? data : [];
            renderTablaInactivos(_articulosInactivos);
        } catch (e) {
            tabla.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al cargar inactivos</td></tr>`;
        }
    }

    function renderTablaInactivos(data) {
        const tabla = document.getElementById('articuloBodyInactivos');
        const info  = document.getElementById('info-registros-art-inactivos');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay artículos inactivos</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'articuloBodyInactivos', filasPorPagina: 10, sufijo: 'art-inactivos' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_articulosInactivos.length} registros`;

        tabla.innerHTML = data.map((a, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${a.nombre}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.categoria || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.unidad || '—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${a.stock}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${a.almacen || '—'}</td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="reactivarArticulo(${a.pk_articulo}, '${(a.nombre||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                        Reactivar
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'articuloBodyInactivos', filasPorPagina: 10, sufijo: 'art-inactivos' });
    }

    window.filtrarInactivos = function () {
        const q = (document.getElementById('searchInactivos')?.value || '').toLowerCase();
        renderTablaInactivos(_articulosInactivos.filter(a =>
            !q || `${a.nombre} ${a.categoria || ''} ${a.almacen || ''}`.toLowerCase().includes(q)
        ));
    };

    // ════════════════════════════════════════
    // SWITCH TABS
    // ════════════════════════════════════════
    window.switchTabPrincipal = function (tab) {
        const tabs   = ['articulos', 'movimientos', 'inactivos'];
        const vistas = {
            articulos:   'vistaArticulosTab',
            movimientos: 'vistaMovimientosTab',
            inactivos:   'vistaInactivosTab'
        };
        const tabEls = {
            articulos:   'tabArticulos',
            movimientos: 'tabMovimientos',
            inactivos:   'tabInactivos'
        };

        tabs.forEach(t => {
            document.getElementById(vistas[t])?.classList.toggle('d-none', t !== tab);
            document.getElementById(tabEls[t])?.classList.toggle('active', t === tab);
        });

        const btnNuevoMov = document.getElementById('btnNuevoMovimiento');
        if (btnNuevoMov) btnNuevoMov.classList.toggle('d-none', tab !== 'movimientos');

        // Cerrar formularios inline al cambiar tab
        document.getElementById('vistaFormulario')?.classList.add('d-none');
        document.getElementById('vistaTabla')?.classList.remove('d-none');
        document.getElementById('vistaFormularioMovimiento')?.classList.add('d-none');
        document.getElementById('vistaTablaMovimientos')?.classList.remove('d-none');

        if (tab === 'movimientos') listarMovimientos();
        if (tab === 'inactivos')   listarInactivos();
    };

    // ════════════════════════════════════════
    // FORMULARIO ARTÍCULO
    // ════════════════════════════════════════
    function resetFormularioArticulo() {
        ['f_pk_articulo','f_nombre','f_categoria','f_fk_unidad','f_fk_almacen','f_fk_partida','f_descripcion','f_codigo_barras']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('f_stock_inicial').value = '';
        document.getElementById('f_stock_minimo').value  = '';
        ['err_nombre','err_categoria','err_unidad','err_almacen']
            .forEach(id => document.getElementById(id)?.classList.add('d-none'));
        document.getElementById('f_stock_inicial').disabled = false;
        document.getElementById('notaStockInicial').classList.remove('d-none');
        document.getElementById('formTituloArticulo').textContent = 'Nuevo Artículo';
        document.getElementById('btnGuardarLabel').textContent    = 'Guardar artículo';
    }

    window.abrirFormulario = function () {
        resetFormularioArticulo();
        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    window.editarArticulo = async function (id) {
        try {
            const a = await fetchWithAuth(`/articulos/${id}`);
            document.getElementById('f_pk_articulo').value   = a.pk_articulo;
            document.getElementById('f_nombre').value        = a.nombre;
            document.getElementById('f_categoria').value     = a.categoria || '';
            document.getElementById('f_fk_unidad').value     = a.fk_unidad || '';
            document.getElementById('f_stock_minimo').value  = a.stock_minimo;
            document.getElementById('f_fk_almacen').value    = a.fk_almacen || '';
            document.getElementById('f_fk_partida').value    = a.fk_partida || '';
            document.getElementById('f_descripcion').value   = a.descripcion || '';
            document.getElementById('f_codigo_barras').value = a.codigo_barras || '';
            document.getElementById('f_stock_inicial').value = a.stock;
            document.getElementById('f_stock_inicial').disabled = true;
            document.getElementById('notaStockInicial').classList.add('d-none');
            document.getElementById('formTituloArticulo').textContent = `Editando: ${a.nombre}`;
            document.getElementById('btnGuardarLabel').textContent    = 'Guardar cambios';
            document.getElementById('vistaTabla').classList.add('d-none');
            document.getElementById('vistaFormulario').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    window.cancelarFormulario = function () {
        resetFormularioArticulo();
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
    };

    window.guardarArticulo = async function () {
        const id        = document.getElementById('f_pk_articulo').value;
        const nombre    = document.getElementById('f_nombre').value.trim();
        const categoria = document.getElementById('f_categoria').value;
        const fk_unidad  = document.getElementById('f_fk_unidad').value;
        const fk_almacen = document.getElementById('f_fk_almacen').value;
        const codigo_barras = document.getElementById('f_codigo_barras')?.value.trim() || null;

        let valido = true;
        if (!nombre)     { document.getElementById('err_nombre').classList.remove('d-none');    valido = false; }
        else               document.getElementById('err_nombre').classList.add('d-none');
        if (!categoria)  { document.getElementById('err_categoria').classList.remove('d-none'); valido = false; }
        else               document.getElementById('err_categoria').classList.add('d-none');
        if (!fk_unidad)  { document.getElementById('err_unidad').classList.remove('d-none');    valido = false; }
        else               document.getElementById('err_unidad').classList.add('d-none');
        if (!fk_almacen) { document.getElementById('err_almacen').classList.remove('d-none');   valido = false; }
        else               document.getElementById('err_almacen').classList.add('d-none');
        if (!valido) return;

        const payload = {
            nombre, categoria, fk_unidad, fk_almacen, codigo_barras,
            fk_partida:    document.getElementById('f_fk_partida').value || null,
            stock_minimo:  parseInt(document.getElementById('f_stock_minimo').value)  || 0,
            stock_inicial: parseInt(document.getElementById('f_stock_inicial').value) || 0,
            descripcion:   document.getElementById('f_descripcion').value.trim() || null
        };

        try {
            if (id) {
                await fetchWithAuth(`/articulos/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Artículo actualizado exitosamente', timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/articulos', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado', text: 'Artículo creado exitosamente', timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            await listarArticulos();
            await cargarStockBajo();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ════════════════════════════════════════
    // LISTAR MOVIMIENTOS
    // ════════════════════════════════════════
    async function listarMovimientos() {
        const tabla = document.getElementById('movBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/movimientos-articulo');
            _movimientos = Array.isArray(data) ? data : [];
            renderTarjetasMovimientos(_movimientos);
            renderTablaMovimientos(_movimientos);
        } catch (e) {
            console.error('Error listar movimientos:', e);
        }
    }

    function renderTarjetasMovimientos(data) {
        const cont = document.getElementById('tarjetasMovimientos');
        if (!cont) return;
        const total    = data.length;
        const entradas = data.filter(m => m.tipo_movimiento === 'entrada').length;
        const salidas  = data.filter(m => m.tipo_movimiento === 'salida').length;
        const bajas    = data.filter(m => m.tipo_movimiento === 'baja').length;
        cont.innerHTML = `
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Movimientos</div>
                <div class="fw-bold" style="font-size:28px;color:#1a3c5e;">${total}</div>
                <div class="text-muted" style="font-size:11px;">Registrados en el sistema</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Entradas</div>
                <div class="fw-bold" style="font-size:24px;color:#2d7a4f;">${entradas}</div>
                <div class="text-muted" style="font-size:11px;">movimiento${entradas !== 1 ? 's' : ''} de entrada</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Salidas</div>
                <div class="fw-bold" style="font-size:24px;color:#c0392b;">${salidas}</div>
                <div class="text-muted" style="font-size:11px;">movimiento${salidas !== 1 ? 's' : ''} de salida</div>
            </div></div></div>
            <div class="col-md-3 col-sm-6"><div class="card border-0 shadow-sm h-100" style="border-radius:10px;"><div class="card-body p-3">
                <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Bajas</div>
                <div class="fw-bold" style="font-size:24px;color:#e67e22;">${bajas}</div>
                <div class="text-muted" style="font-size:11px;">movimiento${bajas !== 1 ? 's' : ''} de baja</div>
            </div></div></div>`;
    }

    function renderTablaMovimientos(data) {
        const tabla = document.getElementById('movBody');
        const info  = document.getElementById('info-registros-mov');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">
                <i class="fa-solid fa-arrow-right-arrow-left fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay movimientos registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_movimientos.length} registros`;

        tabla.innerHTML = data.map((m, i) => {
            const signo = m.tipo_movimiento === 'entrada' ? '+' : '-';
            const color = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : '#c0392b';
            return `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-center">${badgeTipo(m.tipo_movimiento)}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${m.articulo || '—'}</td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;color:${color};">${signo}${m.cantidad}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.area?.trim() || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${m.recibido_por?.trim() || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:200px;">${m.motivo || '—'}</td>
            </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
    }

    function badgeTipo(tipo) {
        if (tipo === 'entrada') return `<span class="badge bg-success" style="font-size:11px;">Entrada</span>`;
        if (tipo === 'salida')  return `<span class="badge bg-danger"  style="font-size:11px;">Salida</span>`;
        return `<span class="badge bg-warning text-dark" style="font-size:11px;">Baja</span>`;
    }

    window.filtrarMovimientos = function () {
        const q    = (document.getElementById('searchMovInput')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipoMov')?.value || '';
        renderTablaMovimientos(_movimientos.filter(m => {
            const txt = `${m.articulo || ''} ${m.motivo || ''} ${m.area || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || m.tipo_movimiento === tipo);
        }));
    };

    // ════════════════════════════════════════
    // FORMULARIO MOVIMIENTO
    // ════════════════════════════════════════
    function resetFormularioMovimiento() {
        limpiarBarcode();
        document.getElementById('f_tipo_movimiento').value  = '';
        const selArt = document.getElementById('f_fk_articulo');
        if (selArt) { selArt.value = ''; selArt.disabled = false; }
        document.getElementById('f_cantidad').value        = 1;
        document.getElementById('f_referencia').value      = '';
        document.getElementById('f_fk_area').value         = '';
        document.getElementById('f_recibido_por').value    = '';
        document.getElementById('f_motivo').value          = '';
        ['err_tipo_mov','err_articulo','err_cantidad','err_area','err_recibido','err_motivo']
            .forEach(id => document.getElementById(id)?.classList.add('d-none'));
        document.getElementById('camposSalida').classList.add('d-none');
        ['card_entrada','card_salida','card_baja'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.borderColor = '#dee2e6'; el.style.background = ''; }
        });
        const header = document.getElementById('formHeaderMovimiento');
        const badge  = document.getElementById('formTipoMovBadge');
        const btn    = document.getElementById('btnGuardarMovimiento');
        if (header) header.style.background = '#1a3c5e';
        if (badge)  badge.textContent = 'Sin tipo';
        if (btn)    btn.style.background = '#1a3c5e';
    }

    window.seleccionarTipoMov = function (tipo) {
        document.getElementById('f_tipo_movimiento').value = tipo;
        ['card_entrada','card_salida','card_baja'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.borderColor = '#dee2e6'; el.style.background = ''; }
        });
        const colores = { entrada: '#2d7a4f', salida: '#c0392b', baja: '#e67e22' };
        const labels  = { entrada: '↓ Entrada', salida: '↑ Salida', baja: '✕ Baja' };
        const color   = colores[tipo];
        const card = document.getElementById(`card_${tipo}`);
        if (card) { card.style.borderColor = color; card.style.background = color + '15'; }
        const header = document.getElementById('formHeaderMovimiento');
        const badge  = document.getElementById('formTipoMovBadge');
        const btn    = document.getElementById('btnGuardarMovimiento');
        if (header) header.style.background = color;
        if (badge)  badge.textContent = labels[tipo];
        if (btn)    btn.style.background = color;
        document.getElementById('camposSalida').classList.toggle('d-none', tipo !== 'salida');
        document.getElementById('err_tipo_mov').classList.add('d-none');
    };

    window.guardarMovimiento = async function () {
        const tipo        = document.getElementById('f_tipo_movimiento').value;
        const fk_articulo = document.getElementById('f_fk_articulo').value;
        const cantidad    = parseInt(document.getElementById('f_cantidad').value);
        const motivo      = document.getElementById('f_motivo').value.trim();

        let valido = true;
        if (!tipo)               { document.getElementById('err_tipo_mov').classList.remove('d-none'); valido = false; }
        else                       document.getElementById('err_tipo_mov').classList.add('d-none');
        if (!fk_articulo)        { document.getElementById('err_articulo').classList.remove('d-none'); valido = false; }
        else                       document.getElementById('err_articulo').classList.add('d-none');
        if (!cantidad || cantidad <= 0) { document.getElementById('err_cantidad').classList.remove('d-none'); valido = false; }
        else                            document.getElementById('err_cantidad').classList.add('d-none');
        if (!motivo)             { document.getElementById('err_motivo').classList.remove('d-none'); valido = false; }
        else                       document.getElementById('err_motivo').classList.add('d-none');

        if (tipo === 'salida') {
            if (!document.getElementById('f_fk_area').value)       { document.getElementById('err_area').classList.remove('d-none');      valido = false; }
            else                                                      document.getElementById('err_area').classList.add('d-none');
            if (!document.getElementById('f_recibido_por').value)  { document.getElementById('err_recibido').classList.remove('d-none');  valido = false; }
            else                                                      document.getElementById('err_recibido').classList.add('d-none');
        }
        if (!valido) return;

        const payload = {
            fk_articulo: parseInt(fk_articulo),
            tipo_movimiento: tipo, cantidad, motivo,
            referencia: document.getElementById('f_referencia').value.trim() || null
        };
        if (tipo === 'salida') {
            payload.fk_area       = parseInt(document.getElementById('f_fk_area').value)       || null;
            payload.recibido_por  = parseInt(document.getElementById('f_recibido_por').value)  || null;
        }

        try {
            await fetchWithAuth('/movimientos-articulo', 'POST', payload);
            Swal.fire({ icon: 'success', title: 'Registrado', text: 'Movimiento registrado exitosamente', timer: 2000, showConfirmButton: false });
            cancelarFormularioMovimiento();
            await listarMovimientos();
            listarArticulos();
            cargarStockBajo();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ════════════════════════════════════════
    // UTILIDADES
    // ════════════════════════════════════════
    function llenarSelect(selectId, datos, valueKey, labelKey) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const primera = select.options[0]?.value === '' ? select.options[0].outerHTML : '';
        select.innerHTML = primera +
            (Array.isArray(datos) ? datos : []).map(d => {
                const label = typeof labelKey === 'function' ? labelKey(d) : d[labelKey];
                return `<option value="${d[valueKey]}">${label}</option>`;
            }).join('');
    }

    // ════════════════════════════════════════
    // HISTORIAL DE ARTÍCULO
    // ════════════════════════════════════════
    window.verHistorialArticulo = async function (id, nombre) {
    const { value: confirm } = await Swal.fire({
        title: `<span style="font-size:16px;color:#1a3c5e;">Historial de movimientos</span>`,
        html: `
            <div class="text-start">
                <p class="mb-3 text-muted" style="font-size:13px;">
                    <i class="fa-solid fa-boxes-stacked me-1"></i><strong>${nombre}</strong>
                </p>
                <div id="swal-historial-body" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
                </div>
            </div>`,
        width: 800,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: async () => {
            try {
                const data = await fetchWithAuth(`/movimientos-articulo/articulo/${id}`);
                const movs = Array.isArray(data) ? data : [];
                const cont = document.getElementById('swal-historial-body');
                if (!cont) return;
                if (!movs.length) {
                    cont.innerHTML = `<div class="text-muted py-3">
                        <i class="fa-solid fa-inbox fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        Sin movimientos registrados</div>`;
                    return;
                }
                cont.innerHTML = `
                    <div class="table-responsive" style="max-height:400px;overflow-y:auto;">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size:12px;">
                            <thead style="position:sticky;top:0;background:#1a3c5e;color:#fff;z-index:1;">
                                <tr>
                                    <th class="px-2 py-2">FECHA</th>
                                    <th class="px-2 py-2 text-center">TIPO</th>
                                    <th class="px-2 py-2 text-center">CANTIDAD</th>
                                    <th class="px-2 py-2">ÁREA</th>
                                    <th class="px-2 py-2">RECIBIÓ</th>
                                    <th class="px-2 py-2">MOTIVO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${movs.map(m => {
                                    const signo = m.tipo_movimiento === 'entrada' ? '+' : '-';
                                    const color = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : '#c0392b';
                                    return `<tr>
                                        <td class="px-2 text-muted">
                                            ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '—'}
                                        </td>
                                        <td class="px-2 text-center">${badgeTipo(m.tipo_movimiento)}</td>
                                        <td class="px-2 text-center fw-semibold" style="color:${color};">
                                            ${signo}${m.cantidad}
                                        </td>
                                        <td class="px-2 text-muted">${m.area?.trim() || '—'}</td>
                                        <td class="px-2 text-muted">${m.recibido_por?.trim() || '—'}</td>
                                        <td class="px-2 text-muted">${m.motivo || '—'}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="text-muted text-end mt-2" style="font-size:11px;">${movs.length} movimiento${movs.length !== 1 ? 's' : ''}</div>`;
            } catch (e) {
                const cont = document.getElementById('swal-historial-body');
                if (cont) cont.innerHTML = `<div class="text-danger py-3">Error al cargar el historial</div>`;
            }
        }
    });
};

    // ════════════════════════════════════════
    // CÓDIGO DE BARRAS
    // ════════════════════════════════════════
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', async function (e) {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const codigo = this.value.trim();
            if (!codigo) return;

            const status = document.getElementById('barcodeStatus');
            status.style.display = 'block';
            status.innerHTML = `<span class="text-muted"><div class="spinner-border spinner-border-sm me-1"></div>Buscando…</span>`;

            try {
                const res = await fetchWithAuth(`/articulos/codigo/${encodeURIComponent(codigo)}`);

                if (res.existe) {
                    // Producto encontrado — autoseleccionar
                    const sel = document.getElementById('f_fk_articulo');
                    if (sel) sel.value = res.data.pk_articulo;
                    status.innerHTML = `<span style="color:#2d7a4f;">
                        <i class="fa-solid fa-circle-check me-1"></i>
                        Producto detectado: <strong>${res.data.nombre}</strong>
                        — Stock actual: ${res.data.stock} ${res.data.unidad || ''}
                    </span>`;
                    this.value = '';
                    document.getElementById('f_cantidad')?.focus();
                } else {
                    // Producto no existe — abrir modal
                    status.innerHTML = `<span style="color:#c0392b;">
                        <i class="fa-solid fa-circle-xmark me-1"></i>
                        Código no registrado — completa los datos para crearlo
                    </span>`;
                    // Llenar modal
                    document.getElementById('bc_codigo').value         = codigo;
                    document.getElementById('bc_nombre').value         = '';
                    document.getElementById('bc_categoria').value      = '';
                    document.getElementById('bc_stock_inicial').value  = '';
                    document.getElementById('bc_stock_minimo').value   = '';
                    ['bc_err_nombre','bc_err_categoria','bc_err_unidad','bc_err_almacen']
                        .forEach(id => document.getElementById(id)?.classList.add('d-none'));

                    // Poblar selects del modal con los catálogos ya cargados
                    llenarSelect('bc_fk_unidad',  _unidades,  'pk_unidad',  'nombre');
                    llenarSelect('bc_fk_almacen', _almacenes, 'pk_almacen', 'nombre');

                    new bootstrap.Modal(document.getElementById('modalNuevoArticuloBarcode')).show();
                    this.value = '';
                }
            } catch (e) {
                status.innerHTML = `<span style="color:#c0392b;">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>Error al buscar el código
                </span>`;
            }
        });
    }

    window.limpiarBarcode = function () {
        const input  = document.getElementById('barcodeInput');
        const status = document.getElementById('barcodeStatus');
        if (input)  input.value = '';
        if (status) { status.style.display = 'none'; status.innerHTML = ''; }
    };

    window.crearArticuloDesdeBarcode = async function () {
        const codigo    = document.getElementById('bc_codigo').value;
        const nombre    = document.getElementById('bc_nombre').value.trim();
        const categoria = document.getElementById('bc_categoria').value;
        const fk_unidad  = document.getElementById('bc_fk_unidad').value;
        const fk_almacen = document.getElementById('bc_fk_almacen').value;

        let valido = true;
        if (!nombre)    { document.getElementById('bc_err_nombre').classList.remove('d-none');    valido = false; }
        else              document.getElementById('bc_err_nombre').classList.add('d-none');
        if (!categoria) { document.getElementById('bc_err_categoria').classList.remove('d-none'); valido = false; }
        else              document.getElementById('bc_err_categoria').classList.add('d-none');
        if (!fk_unidad) { document.getElementById('bc_err_unidad').classList.remove('d-none');    valido = false; }
        else              document.getElementById('bc_err_unidad').classList.add('d-none');
        if (!fk_almacen){ document.getElementById('bc_err_almacen').classList.remove('d-none');   valido = false; }
        else              document.getElementById('bc_err_almacen').classList.add('d-none');
        if (!valido) return;

        try {
            const payload = {
                nombre, categoria, fk_unidad, fk_almacen,
                codigo_barras:  codigo,
                stock_inicial:  parseInt(document.getElementById('bc_stock_inicial').value) || 0,
                stock_minimo:   parseInt(document.getElementById('bc_stock_minimo').value)  || 0
            };

            const nuevo = await fetchWithAuth('/articulos', 'POST', payload);

            bootstrap.Modal.getInstance(
                document.getElementById('modalNuevoArticuloBarcode')
            ).hide();

            // Recargar artículos y autoseleccionar el nuevo
            await listarArticulos();
            const sel = document.getElementById('f_fk_articulo');
            if (sel && nuevo.data) sel.value = nuevo.data.pk_articulo;

            const status = document.getElementById('barcodeStatus');
            if (status) {
                status.style.display = 'block';
                status.innerHTML = `<span style="color:#2d7a4f;">
                    <i class="fa-solid fa-circle-check me-1"></i>
                    Artículo creado y seleccionado: <strong>${nombre}</strong>
                </span>`;
            }

            document.getElementById('f_cantidad')?.focus();

            Swal.fire({ icon: 'success', title: 'Creado',
                text: `Artículo "${nombre}" creado exitosamente`,
                timer: 2000, showConfirmButton: false });

        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

        window.abrirFormularioMovimiento = function (articuloId = null) {
        resetFormularioMovimiento();
        switchTabPrincipal('movimientos');
        document.getElementById('seccionBarcode')?.classList.remove('d-none');
        document.getElementById('f_fk_articulo').disabled = false;
        if (articuloId) {
            const sel = document.getElementById('f_fk_articulo');
            if (sel) sel.value = articuloId;
        }
        document.getElementById('vistaTablaMovimientos').classList.add('d-none');
        document.getElementById('vistaFormularioMovimiento').classList.remove('d-none');
        setTimeout(() => document.getElementById('barcodeInput')?.focus(), 100);
    };

    window.abrirFormularioMovimientoRapido = function (articuloId) {
        resetFormularioMovimiento();
        switchTabPrincipal('movimientos');
        document.getElementById('vistaTablaMovimientos').classList.add('d-none');
        document.getElementById('vistaFormularioMovimiento').classList.remove('d-none');
        document.getElementById('seccionBarcode')?.classList.add('d-none');
        limpiarBarcode();
        setTimeout(() => {
            const sel = document.getElementById('f_fk_articulo');
            if (sel) {
                sel.value = articuloId;
                sel.disabled = true;
            }
            document.getElementById('f_cantidad')?.focus();
        }, 50);
    };

        window.cancelarFormularioMovimiento = function () {
        resetFormularioMovimiento();
        // Restaurar escáner y artículo al cancelar
        document.getElementById('seccionBarcode')?.classList.remove('d-none');
        document.getElementById('f_fk_articulo').disabled = false;
        document.getElementById('vistaFormularioMovimiento').classList.add('d-none');
        document.getElementById('vistaTablaMovimientos').classList.remove('d-none');
    };
    
})();