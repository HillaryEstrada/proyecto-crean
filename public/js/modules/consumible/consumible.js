// ============================================
// MÓDULO: consumible.js
// Descripción: Gestión de artículos y movimientos de consumibles
// ============================================

(function () {

    let _articulos          = [];
    window._movCache = [];
    let _movimientos        = [];
    let _unidades           = [];
    let _partidas           = [];
    let _ubicacionesExt     = [];
    let _ubicacionesInt     = [];
    let _areas              = [];
    let _empleados          = [];

    esperarElemento('movBody', async () => {
        await cargarCatalogos();
        await listarMovimientos();
        await cargarStockBajo();
        switchTabPrincipal('movimientos');
    }, 20, 'consumible/consumible');

    // ============================================
    // CATÁLOGOS
    // ============================================
    async function cargarCatalogos() {
        const cargar = async (url) => {
            try { const d = await fetchWithAuth(url); return Array.isArray(d) ? d : []; }
            catch (e) { console.error(`Error ${url}:`, e); return []; }
        };
        _unidades  = await cargar('/unidad-medida');
        _partidas  = await cargar('/partida-presupuestal');
        _areas     = await cargar('/area');
        _empleados = await cargar('/empleados');
        _ubicacionesExt = await cargar('/ubicacion?tipo=exterior');
        _ubicacionesInt = await cargar('/ubicacion?tipo=interior');
        _articulos = await cargar('/articulos');

        llenarSelect('f_fk_unidad',      _unidades,  'pk_unidad',   'nombre');
        llenarSelect('f_fk_partida',     _partidas,  'clave',       'nombre');
        llenarSelect('f_fk_area',        _areas,     'pk_area',     'nombre');
        llenarSelect('f_recibido_por',   _empleados, 'pk_empleado', e => `${e.nombre} ${e.apellido_paterno}`);
        llenarSelect('f_autorizado_por', _empleados, 'pk_empleado', e => `${e.nombre} ${e.apellido_paterno}`);
        llenarSelect('bc_fk_partida',    _partidas,  'clave',       'nombre');
        llenarSelect('f_fk_ubicacion_exterior',  _ubicacionesExt, 'pk_ubicacion', 'nombre');
        llenarSelect('f_fk_ubicacion_interior',  _ubicacionesInt, 'pk_ubicacion', 'nombre');
        llenarSelect('bc_fk_ubicacion_exterior', _ubicacionesExt, 'pk_ubicacion', 'nombre');
        llenarSelect('bc_fk_ubicacion_interior', _ubicacionesInt, 'pk_ubicacion', 'nombre');
        llenarSelect('sel_empleado_vales', _empleados, 'pk_empleado', e => `${e.nombre} ${e.apellido_paterno}`);
        llenarSelect('f_fk_articulo', _articulos, 'pk_articulo', 'nombre');
        llenarSelect('filtroPartida', _partidas, 'clave', 'nombre');
    }

    // ============================================
    // LISTAR MOVIMIENTOS
    // ============================================
    async function listarMovimientos() {
        const tabla = document.getElementById('movBody');
        if (!tabla) return;
        try {
            const data   = await fetchWithAuth('/movimientos-articulo');
            _movimientos = Array.isArray(data) ? data : [];
            window._movCache    = []; // Limpiar cache
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

        const filtro = document.getElementById('filtroTipoMov')?.value || '';

        // Definir columnas por tipo
        const columnas = {
            '': [
                { label: '#', key: 'num' },
                { label: 'FECHA Y HORA', key: 'fecha' },
                { label: 'TIPO', key: 'tipo' },
                { label: 'ARTÍCULO', key: 'articulo' },
                { label: 'CANTIDAD', key: 'cantidad' },
                { label: 'VER DETALLE', key: 'detalle' },
            ],
            'entrada': [
                { label: '#', key: 'num' },
                { label: 'FECHA Y HORA', key: 'fecha' },
                { label: 'ARTÍCULO', key: 'articulo' },
                { label: 'CANTIDAD', key: 'cantidad' },
                { label: 'Nº FACTURA', key: 'numero_factura' },
                { label: 'SOLICITUD', key: 'motivo_memo' },
                { label: 'VER DETALLE', key: 'detalle' },
            ],
            'salida': [
                { label: '#', key: 'num' },
                { label: 'FECHA Y HORA', key: 'fecha' },
                { label: 'ARTÍCULO', key: 'articulo' },
                { label: 'CANTIDAD', key: 'cantidad' },
                { label: 'ÁREA', key: 'area' },
                { label: 'FOLIO VALE', key: 'folio_vale' },
                { label: 'VER DETALLE', key: 'detalle' },
            ],
            'baja': [
                { label: '#', key: 'num' },
                { label: 'FECHA Y HORA', key: 'fecha' },
                { label: 'ARTÍCULO', key: 'articulo' },
                { label: 'CANTIDAD', key: 'cantidad' },
                { label: 'TIPO DE BAJA', key: 'tipo_baja' },
                { label: 'VER DETALLE', key: 'detalle' },
            ],
        };

        const cols = columnas[filtro] || columnas[''];
        const colspan = cols.length;

        if (!data.length) {
            document.querySelector('#movBody').closest('table').querySelector('thead tr').innerHTML =
                cols.map(c => `<th class="py-3 px-3">${c.label}</th>`).join('');
            tabla.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-5 text-muted">
                <i class="fa-solid fa-arrow-right-arrow-left fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay movimientos registrados</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
            return;
        }

        // Actualizar thead dinámicamente
        document.querySelector('#movBody').closest('table').querySelector('thead tr').innerHTML =
            cols.map(c => `<th class="py-3 px-3 text-center" style="font-size:12px;font-weight:600;">${c.label}</th>`).join('');

        if (info) info.textContent = `Mostrando ${data.length} de ${_movimientos.length} registros`;

        const formatFecha = (val) => {
            if (!val) return '—';
            const s = String(val).slice(0, 10);
            const [y, mc, d] = s.split('-');
            return `${d}/${mc}/${y}`;
        };

        const formatHora = (val) => {
            if (!val) return '';
            const dt = new Date(val);
            const h  = String(dt.getHours()).padStart(2,'0');
            const mi = String(dt.getMinutes()).padStart(2,'0');
            return `${h}:${mi}`;
        };

        tabla.innerHTML = data.map((m, i) => {
            const signo = m.tipo_movimiento === 'entrada' ? '+' : m.tipo_movimiento === 'salida' ? '-' : '-';
            const color = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : m.tipo_movimiento === 'salida' ? '#c0392b' : '#e67e22';

            const adjunto = m.archivo_factura
                ? `<a href="${m.archivo_factura}" target="_blank" class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-file-pdf"></i></a>`
                : m.archivo_acta
                ? `<a href="${m.archivo_acta}" target="_blank" class="btn btn-sm btn-outline-warning"><i class="fa-solid fa-file-circle-check"></i></a>`
                : '—';

            window._movCache[i] = m; // Cache para detalle
            const celdas = cols.map(c => {
                switch(c.key) {
                    case 'num':           return `<td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>`;
                    case 'fecha':         return `<td class="px-3 text-center text-muted" style="font-size:12px;">${formatFecha(m.fecha)} • ${formatHora(m.fecha)}</td>`;
                    case 'tipo':          return `<td class="px-3 text-center">${badgeTipo(m.tipo_movimiento)}</td>`;
                    case 'articulo':      return `<td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${m.articulo || '—'}</td>`;
                    case 'cantidad':      return `<td class="px-3 text-center fw-semibold" style="font-size:13px;color:${color};">${signo}${m.cantidad}</td>`;
                    case 'numero_factura':return `<td class="px-3 text-muted" style="font-size:12px;">${m.numero_factura || '—'}</td>`;
                    case 'fecha_factura': return `<td class="px-3 text-muted" style="font-size:12px;">${formatFecha(m.fecha_factura)}</td>`;
                    case 'motivo_memo':   return `<td class="px-3 text-muted" style="font-size:12px;">${m.folio_memorandum || '—'}</td>`;
                    case 'tipo_baja': {
                            const labels = { merma:'Merma', dano:'Daño', perdida:'Pérdida', vencimiento:'Vencimiento'};
                            return `<td class="px-3 text-muted" style="font-size:12px;">${labels[m.tipo_baja] || m.tipo_baja || '—'}</td>`;
                        }
                    case 'archivo':       return `<td class="px-3 text-center" style="font-size:12px;">${adjunto}</td>`;
                    case 'area':          return `<td class="px-3 text-muted" style="font-size:13px;">${m.area?.trim() || '—'}</td>`;
                    case 'recibido':      return `<td class="px-3 text-muted" style="font-size:13px;">${m.recibido_por?.trim() || '—'}</td>`;
                    case 'autorizado':    return `<td class="px-3 text-muted" style="font-size:13px;">${m.autorizado_por?.trim() || '—'}</td>`;
                    case 'folio_vale':    return `<td class="px-3 text-muted" style="font-size:12px;">${m.folio_vale ? `<span class="badge bg-info text-dark" style="font-size:11px;">${m.folio_vale}</span>` : '—'}</td>`;
                    case 'registrado_por': return `<td class="px-3 text-muted" style="font-size:12px;">${m.registrado_por || '—'}</td>`;
                    case 'motivo':        return `<td class="px-3 text-muted" style="font-size:12px;max-width:180px;">${m.motivo || '—'}</td>`;
                    case 'detalle':       return `<td class="px-3 text-center">
                        <button class="btn btn-sm btn-outline-secondary" title="Ver detalle"
                            onclick="verDetalleMovimiento(window._movCache[${i}])">
                            <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                        </button>
                    </td>`;
                    default:              return `<td>—</td>`;
                }
            }).join('');

            return `<tr>${celdas}</tr>`;
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
            const txt = `${m.articulo || ''} ${m.motivo || ''} ${m.area || ''} ${m.folio_vale || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || m.tipo_movimiento === tipo);
        }));
    };

    // ============================================
    // LISTAR ARTÍCULOS ACTIVOS
    // ============================================
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
            const data  = await fetchWithAuth('/articulos/stock-bajo');
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

    function renderTablaArticulos(data) {
        const tabla = document.getElementById('articuloBody');
        const info  = document.getElementById('info-registros-art');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">
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
            <td class="px-3 text-muted" style="font-size:13px;">${a.unidad || '—'}</td>
            <td class="px-3 text-center fw-semibold" style="font-size:13px;color:${colorStock(a.estado_stock)};">${a.stock}</td>
            <td class="px-3 text-center text-muted" style="font-size:13px;">${a.stock_minimo}</td>
            <td class="px-3 text-muted" style="font-size:13px;">
                ${a.ubicacion_exterior || a.ubicacion_interior || '—'}
            </td>
            <td class="px-3 text-center">${badgeEstado(a.estado_stock)}</td>
            <td class="px-3 text-center" style="white-space:nowrap;">
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
        const q       = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado  = document.getElementById('filtroEstado')?.value || '';
        const partida = document.getElementById('filtroPartida')?.value || '';

        renderTablaArticulos(_articulos.filter(a => {
            const txt = `${a.nombre} ${a.codigo_barras || ''}`.toLowerCase();
            return (!q || txt.includes(q))
                && (!estado  || a.estado_stock === estado)
                && (!partida || a.fk_partida   === partida);
        }));
    };

    // ============================================
    // SWITCH TABS
    // ============================================
    window.switchTabPrincipal = function (tab) {
        const vistas = { movimientos: 'vistaMovimientosTab', articulos: 'vistaArticulosTab', vales: 'vistaValesEmpleadoTab' };
        const tabEls = { movimientos: 'tabMovimientos', articulos: 'tabArticulos', vales: 'tabValesEmpleado' };

        Object.keys(vistas).forEach(t => {
            document.getElementById(vistas[t])?.classList.toggle('d-none', t !== tab);
            document.getElementById(tabEls[t])?.classList.toggle('active', t === tab);
        });

        const btnNuevoMov = document.getElementById('btnNuevoMovimiento');
        if (btnNuevoMov) btnNuevoMov.classList.toggle('d-none', tab !== 'movimientos');

        document.getElementById('vistaFormulario')?.classList.add('d-none');
        document.getElementById('vistaTabla')?.classList.remove('d-none');
        document.getElementById('vistaFormularioMovimiento')?.classList.add('d-none');
        document.getElementById('vistaTablaMovimientos')?.classList.remove('d-none');

        if (tab === 'movimientos') listarMovimientos();
        if (tab === 'articulos')   listarArticulos();
        if (tab === 'vales') llenarSelectValesEmpleado();
    };

    // ============================================
    // FORMULARIO ARTÍCULO
    // ============================================
    function resetFormularioArticulo() {
        ['f_pk_articulo','f_nombre','f_fk_unidad',
        'f_fk_partida','f_descripcion','f_codigo_barras',
        'f_fk_ubicacion_exterior','f_fk_ubicacion_interior']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('f_stock_inicial').value    = '';
        document.getElementById('f_stock_minimo').value     = '';
        document.getElementById('f_stock_inicial').disabled = false;
        document.getElementById('notaStockInicial').classList.remove('d-none');
        document.getElementById('formTituloArticulo').textContent = 'Nuevo Artículo';
        document.getElementById('btnGuardarLabel').textContent    = 'Guardar artículo';
        ['err_nombre','err_unidad']
            .forEach(id => document.getElementById(id)?.classList.add('d-none'));
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
            document.getElementById('f_pk_articulo').value      = a.pk_articulo;
            document.getElementById('f_nombre').value           = a.nombre;
            document.getElementById('f_fk_unidad').value        = a.fk_unidad || '';
            document.getElementById('f_stock_minimo').value     = a.stock_minimo;
            document.getElementById('f_fk_partida').value       = a.fk_partida || '';
            document.getElementById('f_fk_ubicacion_exterior').value = a.fk_ubicacion_exterior || '';
            document.getElementById('f_fk_ubicacion_interior').value = a.fk_ubicacion_interior || '';
            document.getElementById('f_descripcion').value      = a.descripcion || '';
            document.getElementById('f_codigo_barras').value    = a.codigo_barras || '';
            document.getElementById('f_stock_inicial').value    = a.stock;
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
        const id         = document.getElementById('f_pk_articulo').value;
        const nombre     = document.getElementById('f_nombre').value.trim();
        const fk_unidad  = document.getElementById('f_fk_unidad').value;
        const codigo_barras = document.getElementById('f_codigo_barras')?.value.trim() || null;
        const fk_ubi_ext = document.getElementById('f_fk_ubicacion_exterior').value || null;
        const fk_ubi_int = document.getElementById('f_fk_ubicacion_interior').value || null;

        let valido = true;
        if (!nombre)     { document.getElementById('err_nombre').classList.remove('d-none');    valido = false; }
        else               document.getElementById('err_nombre').classList.add('d-none');
        if (!fk_unidad)  { document.getElementById('err_unidad').classList.remove('d-none');    valido = false; }
        else               document.getElementById('err_unidad').classList.add('d-none');
        if (!valido) return;

        const payload = {
            nombre, fk_unidad, codigo_barras,
            fk_partida:            document.getElementById('f_fk_partida').value || null,
            fk_ubicacion_exterior: fk_ubi_ext ? fk_ubi_ext : null,
            fk_ubicacion_interior: fk_ubi_int ? fk_ubi_int : null,
            stock_minimo:          parseInt(document.getElementById('f_stock_minimo').value) || 0,
            stock_inicial:         parseInt(document.getElementById('f_stock_inicial').value) || 0,
            descripcion:           document.getElementById('f_descripcion').value.trim() || null
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

    window.reactivarArticulo = async function (id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question', title: 'Reactivar artículo',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar', cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/articulos/${id}/reactivar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado', text: 'Artículo reactivado exitosamente', timer: 2000, showConfirmButton: false });
            await listarArticulos();
            await listarInactivos();
            switchTabPrincipal('articulos');
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ============================================
    // FORMULARIO MOVIMIENTO
    // ============================================
    function resetFormularioMovimiento() {
        limpiarBarcode();
        document.getElementById('f_tipo_movimiento').value = '';
        const selArt = document.getElementById('f_fk_articulo');
        if (selArt) { selArt.value = ''; selArt.disabled = false; }
        document.getElementById('f_cantidad').value     = 1;
        document.getElementById('f_fk_area').value      = '';
        document.getElementById('f_recibido_por').value = '';
        document.getElementById('f_motivo').value       = '';

        const factura  = document.getElementById('f_numero_factura');
        const memo     = document.getElementById('f_folio_memorandum');
        const autoriza = document.getElementById('f_autorizado_por');
        if (factura)  factura.value  = '';
        if (memo)     memo.value     = '';
        if (autoriza) autoriza.value = '';

        document.getElementById('camposSalida').classList.add('d-none');
        document.getElementById('campoEntrada')?.classList.add('d-none');

        ['err_tipo_mov','err_articulo','err_cantidad','err_area',
         'err_recibido','err_motivo','err_autorizado','err_numero_factura']
            .forEach(id => document.getElementById(id)?.classList.add('d-none'));

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

        const fechaFac = document.getElementById('f_fecha_factura');
        const archFac  = document.getElementById('f_archivo_factura');
        const archActa = document.getElementById('f_archivo_acta');
        if (fechaFac)  fechaFac.value  = '';
        if (archFac)   archFac.value   = '';
        if (archActa)  archActa.value  = '';
        document.getElementById('campoFechaFactura')?.classList.add('d-none');
        document.getElementById('campoArchivoFactura')?.classList.add('d-none');
        document.getElementById('campoArchivoActa')?.classList.add('d-none');

        document.getElementById('campoTipoBaja')?.classList.add('d-none');
        const tipoBaja = document.getElementById('f_tipo_baja');
        if (tipoBaja) tipoBaja.value = '';
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
        document.getElementById('campoEntrada').classList.toggle('d-none', tipo !== 'entrada');
        // Mostrar memorándum en entrada Y salida (no en baja)
        document.getElementById('campoMemorandum')?.classList.toggle('d-none', tipo !== 'entrada');
        document.getElementById('err_tipo_mov').classList.add('d-none');
        document.getElementById('camposMovimiento').classList.remove('d-none');

        document.getElementById('campoFechaFactura')?.classList.toggle('d-none', tipo !== 'entrada');
        document.getElementById('campoArchivoFactura')?.classList.toggle('d-none', tipo !== 'entrada');
        document.getElementById('campoArchivoActa')?.classList.toggle('d-none', tipo !== 'baja');
        document.getElementById('campoTipoBaja')?.classList.toggle('d-none', tipo !== 'baja');
    };

    async function subirArchivo(file) {
        const formData = new FormData();
        formData.append('archivo', file);
        const res = await fetch('/archivo/temporal', {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
        });
        if (!res.ok) throw new Error('Error al subir archivo');
        const data = await res.json();
        return data.url;
    }

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

        if (tipo === 'entrada') {
            const factura = document.getElementById('f_numero_factura')?.value.trim();
            if (!factura) { document.getElementById('err_numero_factura').classList.remove('d-none'); valido = false; }
            else            document.getElementById('err_numero_factura').classList.add('d-none');
        }

        if (tipo === 'salida') {
            if (!document.getElementById('f_fk_area').value) {
                document.getElementById('err_area').classList.remove('d-none'); valido = false;
            } else { document.getElementById('err_area').classList.add('d-none'); }

            if (!document.getElementById('f_recibido_por').value) {
                document.getElementById('err_recibido').classList.remove('d-none'); valido = false;
            } else { document.getElementById('err_recibido').classList.add('d-none'); }

            if (!document.getElementById('f_autorizado_por').value) {
                document.getElementById('err_autorizado').classList.remove('d-none'); valido = false;
            } else { document.getElementById('err_autorizado').classList.add('d-none'); }
        }

        if (tipo === 'baja') {
            if (!document.getElementById('f_tipo_baja').value) {
                document.getElementById('err_tipo_baja').classList.remove('d-none'); valido = false;
            } else {
                document.getElementById('err_tipo_baja').classList.add('d-none');
            }
        }

        if (!valido) return;

         // Subir archivos si existen
        let archivo_factura = null;
        let archivo_acta    = null;

        const fileFactura = document.getElementById('f_archivo_factura')?.files[0];
        const fileActa    = document.getElementById('f_archivo_acta')?.files[0];

        if (fileFactura) archivo_factura = await subirArchivo(fileFactura);
        if (fileActa)    archivo_acta    = await subirArchivo(fileActa);

        const payload = {
            fk_articulo:      parseInt(fk_articulo),
            tipo_movimiento:  tipo,
            cantidad, motivo,
            folio_memorandum: tipo === 'entrada' ? (document.getElementById('f_folio_memorandum')?.value.trim() || null) : null,
            fecha_factura:    document.getElementById('f_fecha_factura')?.value || null,
            archivo_factura,
            archivo_acta,
            tipo_baja: tipo === 'baja' ? (document.getElementById('f_tipo_baja')?.value || null) : null,
        };

        if (tipo === 'entrada') {
            payload.numero_factura = document.getElementById('f_numero_factura').value.trim();
        }

        if (tipo === 'salida') {
            payload.fk_area        = parseInt(document.getElementById('f_fk_area').value)        || null;
            payload.recibido_por   = parseInt(document.getElementById('f_recibido_por').value)   || null;
            payload.autorizado_por = parseInt(document.getElementById('f_autorizado_por').value) || null;
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

    window.abrirFormularioMovimiento = function (articuloId = null) {
        resetFormularioMovimiento();
        switchTabPrincipal('movimientos');
        document.getElementById('seccionBarcode')?.classList.remove('d-none');
        document.getElementById('f_fk_articulo').disabled = false;
        if (articuloId) document.getElementById('f_fk_articulo').value = articuloId;
        document.getElementById('vistaTablaMovimientos').classList.add('d-none');
        document.getElementById('vistaFormularioMovimiento').classList.remove('d-none');
        document.getElementById('camposMovimiento')?.classList.add('d-none');
        setTimeout(() => document.getElementById('barcodeInput')?.focus(), 100);
    };

        window.cancelarFormularioMovimiento = function () {
        resetFormularioMovimiento();
        document.getElementById('seccionBarcode')?.classList.remove('d-none');
        document.getElementById('f_fk_articulo').disabled = false;
        document.getElementById('vistaFormularioMovimiento').classList.add('d-none');
        document.getElementById('vistaTablaMovimientos').classList.remove('d-none');

        // Resetear filtro para que la tabla se muestre correctamente
        const filtro = document.getElementById('filtroTipoMov');
        if (filtro) filtro.value = '';
        const search = document.getElementById('searchMovInput');
        if (search) search.value = '';

        listarMovimientos();
    };

    // ============================================
    // HISTORIAL DE ARTÍCULO
    // ============================================
    window.verHistorialArticulo = async function (id, nombre) {
    await Swal.fire({
        title: `<span style="font-size:16px;color:#1a3c5e;">Historial de movimientos</span>`,
        html: `
            <div class="text-start">
                <p class="mb-2 text-muted" style="font-size:13px;">
                    <i class="fa-solid fa-boxes-stacked me-1"></i><strong>${nombre}</strong>
                </p>
                <div id="swal-historial-body" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
                </div>
            </div>`,
        width: 950, showConfirmButton: false, showCloseButton: true,
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
                    <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
                        <div class="position-relative flex-grow-1" style="min-width:160px;">
                            <i class="fa-solid fa-magnifying-glass text-muted"
                                style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:11px;pointer-events:none;"></i>
                            <input type="text" id="hist-search" class="form-control form-control-sm ps-4"
                                placeholder="Buscar por área, folio, motivo…" oninput="filtrarHistorial()">
                        </div>
                        <select id="hist-filtro-tipo" class="form-select form-select-sm" style="width:130px;"
                            onchange="filtrarHistorial()">
                            <option value="">Todos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                            <option value="baja">Bajas</option>
                        </select>
                    </div>
                    <div class="d-flex gap-2 mb-3 flex-wrap">
                        <span class="badge" style="background:#1a3c5e;font-size:11px;">Total: <span id="hist-total">${movs.length}</span></span>
                        <span class="badge bg-success" style="font-size:11px;">Entradas: ${movs.filter(m => m.tipo_movimiento === 'entrada').length}</span>
                        <span class="badge bg-danger"  style="font-size:11px;">Salidas: ${movs.filter(m => m.tipo_movimiento === 'salida').length}</span>
                        <span class="badge bg-warning text-dark" style="font-size:11px;">Bajas: ${movs.filter(m => m.tipo_movimiento === 'baja').length}</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size:12px;">
                            <thead style="position:sticky;top:0;background:#1a3c5e;color:#fff;z-index:1;">
                                <tr>
                                    <th class="px-2 py-2">FECHA Y HORA</th>
                                    <th class="px-2 py-2 text-center">TIPO</th>
                                    <th class="px-2 py-2 text-center">CANT.</th>
                                    <th class="px-2 py-2">ÁREA</th>
                                    <th class="px-2 py-2">RECIBIÓ</th>
                                    <th class="px-2 py-2">ENTREGÓ</th>
                                    <th class="px-2 py-2">FOLIO VALE</th>
                                    <th class="px-2 py-2">MOTIVO</th>
                                </tr>
                            </thead>
                            <tbody id="hist-body"></tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                        <div id="hist-info" class="text-muted" style="font-size:11px;"></div>
                        <div class="d-flex align-items-center gap-1">
                            <button class="btn btn-sm text-white px-2 py-1" style="background:#1a3c5e;font-size:11px;"
                                onclick="histPaginar(-1)">‹ Ant</button>
                            <span id="hist-pag-info" class="text-muted" style="font-size:11px;"></span>
                            <button class="btn btn-sm text-white px-2 py-1" style="background:#1a3c5e;font-size:11px;"
                                onclick="histPaginar(1)">Sig ›</button>
                        </div>
                    </div>`;

                window._histMovs     = movs;
                window._histFiltrado = movs;
                window._histPagina   = 1;
                window._histPorPag   = 10;
                window.renderHistorialPagina();

            } catch (e) {
                const cont = document.getElementById('swal-historial-body');
                if (cont) cont.innerHTML = `<div class="text-danger py-3">Error al cargar el historial</div>`;
            }
        }
    });
};

    window.renderHistorialPagina = function () {
        const data      = window._histFiltrado || [];
        const porPag    = window._histPorPag   || 10;
        const pag       = window._histPagina   || 1;
        const total     = data.length;
        const totalPags = Math.max(1, Math.ceil(total / porPag));
        if (pag > totalPags) window._histPagina = totalPags;
        const inicio = (window._histPagina - 1) * porPag;
        const slice  = data.slice(inicio, inicio + porPag);

        const fmtFecha = (val) => {
            if (!val) return '—';
            const s = String(val).slice(0,10);
            const [y,mc,d] = s.split('-');
            const dt = new Date(val);
            return `${d}/${mc}/${y} • ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
        };

        const badge = (tipo) => {
            if (tipo === 'entrada') return `<span class="badge bg-success" style="font-size:10px;">Entrada</span>`;
            if (tipo === 'salida')  return `<span class="badge bg-danger"  style="font-size:10px;">Salida</span>`;
            return `<span class="badge bg-warning text-dark" style="font-size:10px;">Baja</span>`;
        };

        const tbody = document.getElementById('hist-body');
        if (!tbody) return;

        tbody.innerHTML = slice.length
            ? slice.map(m => {
                const signo = m.tipo_movimiento === 'entrada' ? '+' : '-';
                const color = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : m.tipo_movimiento === 'salida' ? '#c0392b' : '#e67e22';
                return `<tr>
                    <td class="px-2 text-muted" style="white-space:nowrap;">${fmtFecha(m.fecha)}</td>
                    <td class="px-2 text-center">${badge(m.tipo_movimiento)}</td>
                    <td class="px-2 text-center fw-semibold" style="color:${color};">${signo}${m.cantidad}</td>
                    <td class="px-2 text-muted">${m.area?.trim() || '—'}</td>
                    <td class="px-2 text-muted">${m.recibido_por?.trim() || '—'}</td>
                    <td class="px-2 text-muted">${m.registrado_por?.trim() || '—'}</td>
                    <td class="px-2 text-muted">${m.folio_vale
                        ? `<span class="badge bg-info text-dark" style="font-size:10px;">${m.folio_vale}</span>`
                        : '—'}</td>
                    <td class="px-2 text-muted" style="max-width:150px;">${m.motivo || '—'}</td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="8" class="text-center py-3 text-muted">Sin resultados</td></tr>`;

        const info = document.getElementById('hist-info');
        if (info) info.textContent = `Mostrando ${inicio + 1}–${Math.min(inicio + porPag, total)} de ${total} movimiento${total !== 1 ? 's' : ''}`;
        const pagInfo = document.getElementById('hist-pag-info');
        if (pagInfo) pagInfo.textContent = `Pág. ${window._histPagina} / ${totalPags}`;
        const totalEl = document.getElementById('hist-total');
        if (totalEl) totalEl.textContent = total;
    };

    window.histPaginar = function (dir) {
        const total     = window._histFiltrado?.length || 0;
        const totalPags = Math.max(1, Math.ceil(total / (window._histPorPag || 10)));
        window._histPagina = Math.min(totalPags, Math.max(1, (window._histPagina || 1) + dir));
        window.renderHistorialPagina();
    };

    window.filtrarHistorial = function () {
        const q    = (document.getElementById('hist-search')?.value || '').toLowerCase();
        const tipo = document.getElementById('hist-filtro-tipo')?.value || '';
        window._histFiltrado = (window._histMovs || []).filter(m => {
            const txt = `${m.area || ''} ${m.folio_vale || ''} ${m.motivo || ''} ${m.recibido_por || ''} ${m.registrado_por || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || m.tipo_movimiento === tipo);
        });
        window._histPagina = 1;
        window.renderHistorialPagina();
    };

    // ============================================
    // CÓDIGO DE BARRAS
    // ============================================
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
                    const sel = document.getElementById('f_fk_articulo');
                    if (sel) sel.value = res.data.pk_articulo;
                    status.innerHTML = `<span style="color:#2d7a4f;">
                        <i class="fa-solid fa-circle-check me-1"></i>
                        Producto detectado: <strong>${res.data.nombre}</strong> — Stock: ${res.data.stock} ${res.data.unidad || ''}
                    </span>`;
                    this.value = '';
                    document.getElementById('f_cantidad')?.focus();
                } else {
                    status.innerHTML = `<span style="color:#c0392b;">
                        <i class="fa-solid fa-circle-xmark me-1"></i>
                        Código no registrado — completa los datos para crearlo
                    </span>`;
                    document.getElementById('bc_codigo').value        = codigo;
                    document.getElementById('bc_nombre').value        = '';
                    document.getElementById('bc_fk_ubicacion_exterior').value = '';
                    document.getElementById('bc_fk_ubicacion_interior').value = '';
                    document.getElementById('bc_stock_inicial').value = '';
                    document.getElementById('bc_stock_minimo').value  = '';
                    ['bc_err_nombre','bc_err_unidad']
                        .forEach(id => document.getElementById(id)?.classList.add('d-none'));
                    llenarSelect('bc_fk_unidad',             _unidades,       'pk_unidad',   'nombre');
                    llenarSelect('bc_fk_ubicacion_exterior', _ubicacionesExt, 'pk_ubicacion','nombre');
                    llenarSelect('bc_fk_ubicacion_interior', _ubicacionesInt, 'pk_ubicacion','nombre');
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
        const codigo                = document.getElementById('bc_codigo').value;
        const nombre                = document.getElementById('bc_nombre').value.trim();
        const fk_unidad             = document.getElementById('bc_fk_unidad').value;
        const fk_ubicacion_exterior = document.getElementById('bc_fk_ubicacion_exterior').value;

        const fk_ubi_int = document.getElementById('bc_fk_ubicacion_interior').value;

        let valido = true;
        if (!nombre)    { document.getElementById('bc_err_nombre').classList.remove('d-none');    valido = false; }
        else              document.getElementById('bc_err_nombre').classList.add('d-none');
        if (!fk_unidad) { document.getElementById('bc_err_unidad').classList.remove('d-none');    valido = false; }
        else              document.getElementById('bc_err_unidad').classList.add('d-none');

        // Validar que escoja al menos un almacén
        if (!fk_ubicacion_exterior && !fk_ubi_int) {
            document.getElementById('bc_err_ubicacion').classList.remove('d-none'); valido = false;
        } else {
            document.getElementById('bc_err_ubicacion').classList.add('d-none');
        }

        if (!valido) return;

        try {
            const payload = {
                nombre, fk_unidad,
                codigo_barras:         codigo,
                fk_ubicacion_exterior: fk_ubicacion_exterior || null,
                fk_ubicacion_interior: document.getElementById('bc_fk_ubicacion_interior').value || null,
                fk_partida:            document.getElementById('bc_fk_partida').value || null,
                stock_minimo:          parseInt(document.getElementById('bc_stock_minimo').value) || 0,
                stock_inicial:         0
            };

            const nuevo = await fetchWithAuth('/articulos', 'POST', payload);
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoArticuloBarcode')).hide();

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
            Swal.fire({ icon: 'success', title: 'Creado', text: `Artículo "${nombre}" creado exitosamente`, timer: 2000, showConfirmButton: false });

        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ============================================
    // UTILIDADES
    // ============================================
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

function llenarSelectValesEmpleado() {
    llenarSelect('sel_empleado_vales', _empleados, 'pk_empleado', e => `${e.nombre} ${e.apellido_paterno}`);
    llenarSelect('sel_area_vales', _areas, 'pk_area', 'nombre');

    // Llenar años dinámicamente (últimos 5)
    const selAnio = document.getElementById('sel_anio_vales');
    if (selAnio) {
        const anioActual = new Date().getFullYear();
        selAnio.innerHTML = '<option value="">Todos</option>' +
            [0,1,2,3,4].map(i => {
                const a = anioActual - i;
                return `<option value="${a}">${a}</option>`;
            }).join('');
    }
}

window.cargarValesEmpleado = async function () {
    const id   = document.getElementById('sel_empleado_vales').value;
    const anio = document.getElementById('sel_anio_vales')?.value || '';
    const area = document.getElementById('sel_area_vales')?.value || '';

    const resultado = document.getElementById('vistaValesResultado');
    const tbody     = document.getElementById('valesEmpleadoBody');
    const info      = document.getElementById('info-vales-empleado');
    if (!id) { resultado.classList.add('d-none'); return; }

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">
        <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
    resultado.classList.remove('d-none');

    try {
        let url = `/movimientos-articulo/empleado/${id}`;
        const params = [];
        if (anio) params.push(`anio=${anio}`);
        if (area) params.push(`fk_area=${area}`);
        if (params.length) url += '?' + params.join('&');

        const data = await fetchWithAuth(url);
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
                <i class="fa-solid fa-inbox fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin vales registrados para este empleado</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            return;
        }
        if (info) info.textContent = `${data.length} vale${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`;
        tbody.innerHTML = data.map(v => {
            const fecha = v.fecha
                ? (() => {
                    const s = String(v.fecha).slice(0,10);
                    const [y,mc,d] = s.split('-');
                    const dt = new Date(v.fecha);
                    const h  = String(dt.getHours()).padStart(2,'0');
                    const mi = String(dt.getMinutes()).padStart(2,'0');
                    return `${d}/${mc}/${y} • ${h}:${mi}`;
                  })()
                : '—';
            return `<tr>
                <td class="px-3"><span class="badge bg-info text-dark" style="font-size:11px;">${v.folio_vale}</span></td>
                <td class="px-3 text-muted" style="font-size:12px;">${fecha}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${v.articulo || '—'}</td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;color:#c0392b;">${v.cantidad}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${v.area || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${v.autorizado_por || '—'}</td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:180px;">${v.motivo || '—'}</td>
            </tr>`;
        }).join('');

        // Guardar para imprimir
        window._valesEmpleadoCache = data;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">Error al cargar los vales</td></tr>`;
    }
};

window.verDetalleMovimiento = function(m) {
    const tipo  = m.tipo_movimiento;
    const color = tipo === 'entrada' ? '#2d7a4f' : tipo === 'salida' ? '#c0392b' : '#e67e22';
    const label = tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : 'Baja';

    const header = document.getElementById('detalleMovHeader');
    const title  = document.getElementById('detalleMovTitle');
    if (header) header.style.background = color;
    if (title)  title.textContent = `${label} — ${m.articulo || '—'}`;

    const formatFecha = (val) => {
        if (!val) return '—';
        const s = String(val).slice(0, 10);
        const [y, mc, d] = s.split('-');
        return `${d}/${mc}/${y}`;
    };
    const formatHora = (val) => {
        if (!val) return '';
        const dt = new Date(val);
        return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    };

    let html = `<div class="row g-3">`;

    // Datos comunes
    html += `
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">ARTÍCULO</p>
            <p class="fw-bold mb-0" style="color:#1a3c5e;">${m.articulo || '—'}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">CANTIDAD</p>
            <p class="fw-bold mb-0" style="color:${color};">${tipo === 'entrada' ? '+' : '-'}${m.cantidad}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">FECHA Y HORA</p>
            <p class="mb-0">${formatFecha(m.fecha)} <span class="text-muted">${formatHora(m.fecha)}</span></p>
        </div>`;

    if (tipo === 'entrada') {
        html += `
        <div class="col-12"><hr class="my-1"></div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">Nº FACTURA</p>
            <p class="mb-0" style="font-family:monospace;">${m.numero_factura || '—'}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">FECHA FACTURA</p>
            <p class="mb-0">${formatFecha(m.fecha_factura)}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">FOLIO MEMORÁNDUM</p>
            <p class="mb-0">${m.folio_memorandum || '—'}</p>
        </div>`;

        if (m.archivo_factura) {
            html += `
        <div class="col-12">
            <p class="text-muted mb-1" style="font-size:11px;">DOCUMENTO FACTURA</p>
            <a href="${m.archivo_factura}" target="_blank" class="btn btn-sm btn-outline-danger">
                <i class="fa-solid fa-file-pdf me-1"></i>Ver PDF / IMG
            </a>
        </div>`;
        }
    }

    if (tipo === 'salida') {
        html += `
        <div class="col-12"><hr class="my-1"></div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">ÁREA</p>
            <p class="mb-0">${m.area || '—'}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">RECIBIÓ</p>
            <p class="mb-0">${m.recibido_por || '—'}</p>
        </div>
        <div class="col-md-4">
            <p class="text-muted mb-1" style="font-size:11px;">AUTORIZADO POR</p>
            <p class="mb-0">${m.autorizado_por || '—'}</p>
        </div>
        <div class="col-md-6">
            <p class="text-muted mb-1" style="font-size:11px;">FOLIO VALE</p>
            <p class="mb-0">${m.folio_vale
                ? `<span class="badge bg-info text-dark">${m.folio_vale}</span>`
                : '—'}</p>
        </div>
        <div class="col-12">
            <p class="text-muted mb-1" style="font-size:11px;">MOTIVO</p>
            <p class="mb-0">${m.motivo || '—'}</p>
        </div>`;
    }

    if (tipo === 'baja') {
    const labels = { merma:'Merma', dano:'Daño', perdida:'Pérdida', vencimiento:'Vencimiento'};
    html += `
            <div class="col-12"><hr class="my-1"></div>
            <div class="col-md-4">
                <p class="text-muted mb-1" style="font-size:11px;">TIPO DE BAJA</p>
                <p class="mb-0">${labels[m.tipo_baja] || m.tipo_baja || '—'}</p>
            </div>`;
        if (m.archivo_acta) {
            html += `
            <div class="col-12">
                <p class="text-muted mb-1" style="font-size:11px;">ACTA DE BAJA</p>
                <a href="${m.archivo_acta}" target="_blank" class="btn btn-sm btn-outline-warning">
                    <i class="fa-solid fa-file-circle-check me-1"></i>Ver documento
                </a>
            </div>`;
        }
    }

    // Motivo y auditoría siempre al final
    html += `
        <div class="col-12"><hr class="my-1"></div>
        ${tipo !== 'salida' ? `
        <div class="col-12">
            <p class="text-muted mb-1" style="font-size:11px;">MOTIVO</p>
            <p class="mb-0">${m.motivo || '—'}</p>
        </div>` : ''}
        <div class="col-12">
            <p class="text-muted mb-1" style="font-size:11px;">ENTREGADO POR</p>
            <p class="mb-0">${m.registrado_por || '—'}</p>
        </div>
    </div>`;

    document.getElementById('detalleMovBody').innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalDetalleMovimiento')).show();
};

window.imprimirReporteEmpleado = function () {
    const data = window._valesEmpleadoCache;
    if (!data?.length) {
        Swal.fire({ icon: 'warning', title: 'Sin datos', text: 'Primero carga los vales de un empleado', timer: 2000, showConfirmButton: false });
        return;
    }

    const selEmp  = document.getElementById('sel_empleado_vales');
    const selAnio = document.getElementById('sel_anio_vales');
    const selArea = document.getElementById('sel_area_vales');
    const nombreEmp = selEmp.options[selEmp.selectedIndex]?.text || '—';
    const anioLabel = selAnio.value || 'Todos los años';
    const areaLabel = selArea.options[selArea.selectedIndex]?.text || 'Todas las áreas';

    // Agrupar por artículo
    const resumen = {};
    data.forEach(v => {
        if (!resumen[v.articulo]) resumen[v.articulo] = 0;
        resumen[v.articulo] += Number(v.cantidad);
    });

    const formatFecha = (val) => {
        if (!val) return '—';
        const s = String(val).slice(0,10);
        const [y,mc,d] = s.split('-');
        return `${d}/${mc}/${y}`;
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte — ${nombreEmp}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 30px; }
        .encabezado { text-align:center; border-bottom:2px solid #1a3c5e; padding-bottom:12px; margin-bottom:20px; }
        .encabezado h2 { font-size:13px; color:#1a3c5e; text-transform:uppercase; letter-spacing:1px; }
        .encabezado h1 { font-size:20px; font-weight:bold; color:#1a3c5e; margin:4px 0; }
        .encabezado p  { font-size:11px; color:#555; }
        .meta { display:flex; gap:30px; margin-bottom:20px; }
        .meta div label { font-size:10px; text-transform:uppercase; color:#666; display:block; }
        .meta div span  { font-weight:bold; font-size:13px; }
        .resumen { margin-bottom:24px; }
        .resumen h3 { font-size:12px; text-transform:uppercase; color:#1a3c5e; margin-bottom:8px; border-bottom:1px solid #ddd; padding-bottom:4px; }
        .resumen table { width:100%; border-collapse:collapse; }
        .resumen td, .resumen th { padding:6px 8px; border:1px solid #ddd; font-size:11px; }
        .resumen thead tr { background:#1a3c5e; color:#fff; }
        .detalle h3 { font-size:12px; text-transform:uppercase; color:#1a3c5e; margin-bottom:8px; border-bottom:1px solid #ddd; padding-bottom:4px; }
        .detalle table { width:100%; border-collapse:collapse; }
        .detalle td, .detalle th { padding:6px 8px; border:1px solid #ddd; font-size:11px; }
        .detalle thead tr { background:#1a3c5e; color:#fff; }
        @media print { body { padding:20px; } }
    </style>
</head>
<body>
    <div class="encabezado">
        <h2>Reporte de consumibles por empleado</h2>
        <h1>Centro de Rendimiento Excelencia Agrícola de Nayarit</h1>
        <p>CREAN — Control de inventario de consumibles</p>
    </div>
    <div class="meta">
        <div><label>Empleado</label><span>${nombreEmp}</span></div>
        <div><label>Período</label><span>${anioLabel}</span></div>
        <div><label>Área</label><span>${areaLabel}</span></div>
        <div><label>Total vales</label><span>${data.length}</span></div>
    </div>

    <div class="resumen">
        <h3>Resumen por artículo</h3>
        <table>
            <thead><tr><th>Artículo</th><th style="width:100px;text-align:center;">Total entregado</th></tr></thead>
            <tbody>
                ${Object.entries(resumen).map(([art, cant]) =>
                    `<tr><td>${art}</td><td style="text-align:center;">${cant}</td></tr>`
                ).join('')}
            </tbody>
        </table>
    </div>

    <div class="detalle">
        <h3>Detalle de vales</h3>
        <table>
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Artículo</th>
                    <th style="text-align:center;">Cant.</th>
                    <th>Área</th>
                    <th>Autorizó</th>
                    <th>Motivo</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(v => `<tr>
                    <td>${v.folio_vale}</td>
                    <td>${formatFecha(v.fecha)}</td>
                    <td>${v.articulo || '—'}</td>
                    <td style="text-align:center;">${v.cantidad}</td>
                    <td>${v.area || '—'}</td>
                    <td>${v.autorizado_por || '—'}</td>
                    <td>${v.motivo || '—'}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 500);
};

})();