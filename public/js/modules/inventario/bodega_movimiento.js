(function () {

    let _movimientos  = [];
    let _bodegas      = [];
    let _productos    = [];
    let _productores  = [];
    let _ejidos       = [];
    let _predios      = [];
    let _filaContador = 0;
    let _idEditando   = null;   // null = crear, número = editar
    let _inventario   = [];     // para el tab de inventario

    esperarElemento('movBody', async () => {
        await cargarCatalogos();
        listar();
    }, 20, 'inventario/bodega_movimiento');

    // ─────────────────────────────────────────
    // SELECCIONAR TIPO (cards visuales)
    // ─────────────────────────────────────────
    window.seleccionarTipo = function (tipo) {
        document.getElementById('f_tipo_movimiento').value = tipo;

        const cEntrada = document.getElementById('card_entrada');
        const cSalida  = document.getElementById('card_salida');

        // Reset ambas
        cEntrada.style.borderColor  = '#dee2e6';
        cEntrada.style.background   = '';
        cSalida.style.borderColor   = '#dee2e6';
        cSalida.style.background    = '';

        if (tipo === 'entrada') {
            cEntrada.style.borderColor = '#2d7a4f';
            cEntrada.style.background  = '#f0faf4';
        } else {
            cSalida.style.borderColor  = '#c0392b';
            cSalida.style.background   = '#fdf2f2';
        }

        // Actualizar colores del formulario
        const headerForm   = document.getElementById('formHeaderMovimiento');
        const headerDetalle = document.getElementById('detalleHeaderColor');
        const badge        = document.getElementById('formTipoBadge');
        const btnGuardar   = document.getElementById('btnGuardarMovimiento');

        if (tipo === 'entrada') {
            const color = '#2d7a4f';
            if (headerForm)    headerForm.style.background    = color;
            if (headerDetalle) headerDetalle.style.background = color;
            if (badge)         badge.textContent = '↓ Entrada';
            if (btnGuardar)    btnGuardar.style.background    = color;
        } else {
            const color = '#c0392b';
            if (headerForm)    headerForm.style.background    = color;
            if (headerDetalle) headerDetalle.style.background = color;
            if (badge)         badge.textContent = '↑ Salida';
            if (btnGuardar)    btnGuardar.style.background    = color;
        }

        // Ocultar error
        document.getElementById('err_tipo')?.classList.add('d-none');

        // Actualizar folio visual
        generarFolioVisual(tipo);
    };

    // ─────────────────────────────────────────
    // GENERAR FOLIO VISUAL (solo display)
    // ─────────────────────────────────────────
    function generarFolioVisual(tipo) {
        const year   = new Date().getFullYear();
        const num    = String((_movimientos.length || 0) + 1).padStart(3, '0');
        const prefijo = tipo === 'entrada' ? 'ENT' : 'SAL';
        const folio   = `${prefijo}-${year}-${num}`;
        const el = document.getElementById('folioDisplay');
        if (el) el.textContent = folio;
        return folio;
    }

    // ─────────────────────────────────────────
    // CARGAR CATÁLOGOS
    // ─────────────────────────────────────────
    async function cargarCatalogos() {
        // Peticiones independientes — una falla no afecta las demás
        const cargar = async (url) => {
            try {
                const data = await fetchWithAuth(url);
                return Array.isArray(data) ? data : [];
            } catch (e) {
                console.error(`Error cargando ${url}:`, e);
                return [];
            }
        };

        _bodegas     = await cargar('/bodega');
        _productos   = await cargar('/bodega_producto');
        _productores = await cargar('/productor');
        _ejidos      = await cargar('/ejido');
        _predios     = await cargar('/predio/todos');

        console.log('Catálogos cargados — predios:', _predios.length,
                    'ejidos:', _ejidos.length, 'bodegas:', _bodegas.length);

        const selBodega = document.getElementById('f_fk_bodega');
        if (selBodega) {
            selBodega.innerHTML = '<option value="">Seleccionar…</option>' +
                _bodegas
                    .filter(b => b.estado === 'Operativo')
                    .map(b => `<option value="${b.pk_bodega}">${b.nombre}</option>`)
                    .join('');
        }
    }

    // ─────────────────────────────────────────
    // LISTAR MOVIMIENTOS
    // ─────────────────────────────────────────
    async function listar() {
        const tabla = document.getElementById('movBody');
        if (!tabla) return;
        try {
            const data   = await fetchWithAuth('/movimiento_bodega');
            _movimientos = Array.isArray(data) ? data : [];
            renderTarjetasMovimientos(_movimientos);
            renderTabla(_movimientos);
        } catch (e) {
            console.error('Error listar movimientos:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los movimientos' });
        }
    }

    // ─────────────────────────────────────────
    // TARJETAS RESUMEN MOVIMIENTOS
    // ─────────────────────────────────────────
    function renderTarjetasMovimientos(data) {
        const cont = document.getElementById('tarjetasMovimientos');
        if (!cont) return;

        const total     = data.length;
        const entradas  = data.filter(m => m.tipo_movimiento === 'entrada');
        const salidas   = data.filter(m => m.tipo_movimiento === 'salida');
        const kgEnt     = entradas.reduce((s, m) => s + parseFloat(m.total_kg || 0), 0);
        const kgSal     = salidas.reduce((s, m)  => s + parseFloat(m.total_kg || 0), 0);
        const balance   = kgEnt - kgSal;
        const tendencia = balance >= 0 ? 'positiva' : 'negativa';
        const tColor    = balance >= 0 ? '#2d7a4f' : '#c0392b';
        const tIcon     = balance >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

        cont.innerHTML = `
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;">
                    <div class="card-body p-3">
                        <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Movimientos</div>
                        <div class="fw-bold" style="font-size:28px;color:#1a3c5e;">${total}</div>
                        <div class="text-muted" style="font-size:11px;">Temporada ${new Date().getFullYear()}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;">
                    <div class="card-body p-3">
                        <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Entradas</div>
                        <div class="fw-bold" style="font-size:24px;color:#2d7a4f;">+${kgEnt.toLocaleString('es-MX')} kg</div>
                        <div class="text-muted" style="font-size:11px;">${entradas.length} movimiento${entradas.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;">
                    <div class="card-body p-3">
                        <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Total Salidas</div>
                        <div class="fw-bold" style="font-size:24px;color:#c0392b;">-${kgSal.toLocaleString('es-MX')} kg</div>
                        <div class="text-muted" style="font-size:11px;">${salidas.length} movimiento${salidas.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;">
                    <div class="card-body p-3">
                        <div class="text-muted mb-1" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Balance Neto</div>
                        <div class="fw-bold" style="font-size:24px;color:${tColor};">${balance >= 0 ? '+' : ''}${balance.toLocaleString('es-MX')} kg</div>
                        <div style="font-size:11px;color:${tColor};">
                            <i class="fa-solid ${tIcon} me-1"></i>Tendencia ${tendencia}
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // ─────────────────────────────────────────
    // RENDER TABLA
    // ─────────────────────────────────────────
    function renderTabla(data) {
        const tabla = document.getElementById('movBody');
        const info  = document.getElementById('info-registros-mov');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-arrow-right-arrow-left fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay movimientos registrados
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_movimientos.length} registros`;

        tabla.innerHTML = data.map((m, i) => {
            const year   = m.fecha ? new Date(m.fecha).getFullYear() : new Date().getFullYear();
            const num    = String(m.pk_movimiento_bodega).padStart(3, '0');
            const folio  = m.tipo_movimiento === 'entrada' ? `ENT-${year}-${num}` : `SAL-${year}-${num}`;
            const kgColor = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : '#c0392b';
            const kgSign  = m.tipo_movimiento === 'entrada' ? '+' : '-';
            return `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' }) : '—'}
                </td>
                <td class="px-3 text-center">
                    <span class="badge" style="font-family:monospace;font-size:11px;
                        background:${m.tipo_movimiento === 'entrada' ? '#e8f5ee' : '#fdecea'};
                        color:${kgColor};border:1px solid ${kgColor}30;">
                        ${folio}
                    </span>
                </td>
                <td class="px-3 text-center">${badgeTipo(m.tipo_movimiento)}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">
                    ${m.bodega_nombre || '—'}
                </td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;color:${kgColor};">
                    ${kgSign}${parseFloat(m.total_kg || 0).toLocaleString('es-MX')} kg
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    <span class="badge bg-light text-dark border">${m.total_productos || 0} prod.</span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;max-width:200px;">
                    ${m.motivo || '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalle(${m.pk_movimiento_bodega})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarMovimiento(${m.pk_movimiento_bodega})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar movimiento"
                        onclick="eliminarMovimiento(${m.pk_movimiento_bodega})">
                        <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'movBody', filasPorPagina: 10, sufijo: 'mov' });
    }

    function badgeTipo(tipo) {
        return tipo === 'entrada'
            ? `<span class="badge bg-success" style="font-size:11px;">Entrada</span>`
            : `<span class="badge bg-danger" style="font-size:11px;">Salida</span>`;
    }

    // ─────────────────────────────────────────
    // FILTRAR
    // ─────────────────────────────────────────
    window.filtrarTabla = function () {
        const q    = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipo')?.value || '';
        const filtrados = _movimientos.filter(m => {
            const txt = `${m.bodega_nombre || ''} ${m.motivo || ''} ${m.registrado_por_usuario || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || m.tipo_movimiento === tipo);
        });
        renderTarjetasMovimientos(filtrados);
        renderTabla(filtrados);
    };

    // ─────────────────────────────────────────
    // RESET FORMULARIO
    // ─────────────────────────────────────────
    function resetFormulario() {
        _idEditando = null;
        _filaContador = 0;
        document.getElementById('f_tipo_movimiento').value = '';
        document.getElementById('f_fk_bodega').value       = '';
        document.getElementById('f_motivo').value          = '';
        document.getElementById('detalleBody').innerHTML   = '';
        document.getElementById('totalKg').textContent     = '0.00';
        document.getElementById('err_tipo').classList.add('d-none');
        document.getElementById('err_bodega').classList.add('d-none');

        // Reset selector visual de tipo
        const cEntrada = document.getElementById('card_entrada');
        const cSalida  = document.getElementById('card_salida');
        if (cEntrada) { cEntrada.style.borderColor = '#dee2e6'; cEntrada.style.background = ''; }
        if (cSalida)  { cSalida.style.borderColor  = '#dee2e6'; cSalida.style.background  = ''; }

        // Reset colores del formulario
        const headerForm    = document.getElementById('formHeaderMovimiento');
        const headerDetalle = document.getElementById('detalleHeaderColor');
        const badge         = document.getElementById('formTipoBadge');
        const btnGuardar    = document.getElementById('btnGuardarMovimiento');
        if (headerForm)    headerForm.style.background    = '#1a3c5e';
        if (headerDetalle) headerDetalle.style.background = '#1a3c5e';
        if (badge)         badge.textContent = 'Sin tipo';
        if (btnGuardar)    btnGuardar.style.background    = '#1a3c5e';

        // Reset contadores
        const elProd = document.getElementById('totalProductos');
        const elBadge = document.getElementById('badgeLineas');
        const elFolio = document.getElementById('folioDisplay');
        if (elProd)  elProd.textContent  = '0';
        if (elBadge) elBadge.textContent = '0 líneas';
        if (elFolio) elFolio.textContent = '—';

        const titulo = document.getElementById('formTituloMovimiento');
        if (titulo) titulo.textContent = 'Nuevo Movimiento';
        const lblGuardar = document.getElementById('lblGuardarMovimiento');
        if (lblGuardar) lblGuardar.textContent = 'Registrar movimiento';
    }

    // ─────────────────────────────────────────
    // ABRIR FORMULARIO (CREAR)
    // ─────────────────────────────────────────
    window.abrirFormulario = function () {
        resetFormulario();
        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        agregarFilaDetalle();
    };

    // ─────────────────────────────────────────
    // EDITAR MOVIMIENTO
    // ─────────────────────────────────────────
    window.editarMovimiento = async function (id) {
        try {
            resetFormulario();
            _idEditando = id;

            const res = await fetchWithAuth(`/movimiento_bodega/${id}`);
            const m   = res.movimiento;
            const det = res.detalles;

            document.getElementById('f_fk_bodega').value = m.fk_bodega || '';
            document.getElementById('f_motivo').value    = m.motivo || '';

            // Restaurar selector visual de tipo
            if (m.tipo_movimiento) seleccionarTipo(m.tipo_movimiento);

            const titulo = document.getElementById('formTituloMovimiento');
            if (titulo) titulo.textContent = `Editando Movimiento #${id}`;
            const lblGuardar = document.getElementById('lblGuardarMovimiento');
            if (lblGuardar) lblGuardar.textContent = 'Guardar cambios';

            document.getElementById('vistaTabla').classList.add('d-none');
            document.getElementById('vistaFormulario').classList.remove('d-none');

            // Cargar filas — todo síncrono, sin timeouts anidados
            for (const d of det) {
                agregarFilaDetalle();
                const rowId = _filaContador;

                // Campos simples
                const setVal = (sel, val) => { const el = document.getElementById(sel); if (el) el.value = val || ''; };
                setVal(`d_producto_${rowId}`,       d.fk_producto);
                setVal(`d_kg_${rowId}`,             d.cantidad_kg);
                setVal(`d_bultos_${rowId}`,         d.cantidad_bultos);
                setVal(`d_peso_bulto_${rowId}`,     d.peso_por_bulto);
                setVal(`d_tipo_recepcion_${rowId}`, d.tipo_recepcion);
                setVal(`d_humedad_${rowId}`,        d.humedad);
                setVal(`d_productor_${rowId}`,      d.fk_productor);

                const analisis = document.getElementById(`d_analisis_${rowId}`);
                if (analisis) analisis.checked = d.analisis_calidad || false;

                // Ejido → filtrar predios → asignar predio (todo síncrono)
                const ejidoSel = document.getElementById(`d_ejido_${rowId}`);
                if (ejidoSel && d.fk_ejido) {
                    ejidoSel.value = d.fk_ejido;
                    // filtrarPredios llena el select de predio síncronamente
                    filtrarPredios(rowId);
                    // ahora el select ya tiene las opciones, asignamos el valor
                    const predioSel = document.getElementById(`d_predio_${rowId}`);
                    if (predioSel && d.fk_predio) predioSel.value = d.fk_predio;
                }
            }

            calcularTotal();
        } catch (e) {
            console.error('Error editar movimiento:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el movimiento' });
        }
    };

    // ─────────────────────────────────────────
    // CANCELAR FORMULARIO
    // ─────────────────────────────────────────
    window.cancelarFormulario = function () {
        resetFormulario();
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
    };

    // ─────────────────────────────────────────
    // AGREGAR FILA DE DETALLE
    // ─────────────────────────────────────────
    window.agregarFilaDetalle = function () {
        _filaContador++;
        const id    = _filaContador;
        const tbody = document.getElementById('detalleBody');

        const optsProducto = _productos
            .filter(p => p.estado === 1)
            .map(p => `<option value="${p.pk_producto}">${p.nombre}${p.variedad ? ' — ' + p.variedad : ''}</option>`)
            .join('');

        const optsProductor = _productores
            .filter(p => p.estado === 1)
            .map(p => `<option value="${p.pk_productor}">${p.nombre}</option>`)
            .join('');

        const optsEjido = _ejidos
            .filter(e => e.estado === 1)
            .map(e => `<option value="${e.pk_ejido}">${e.nombre}</option>`)
            .join('');

        const tr = document.createElement('tr');
        tr.id    = `fila-${id}`;
        tr.innerHTML = `
            <td class="px-1 py-1">
                <select class="form-select form-select-sm" id="d_producto_${id}" required>
                    <option value="">Seleccionar…</option>
                    ${optsProducto}
                </select>
            </td>
            <td class="px-1 py-1">
                <input type="number" class="form-control form-control-sm text-end"
                    id="d_kg_${id}" placeholder="0.00" min="0.01" step="0.01"
                    oninput="calcularTotal()">
            </td>
            <td class="px-1 py-1">
                <input type="number" class="form-control form-control-sm text-center"
                    id="d_bultos_${id}" placeholder="0" min="0">
            </td>
            <td class="px-1 py-1">
                <input type="number" class="form-control form-control-sm text-end"
                    id="d_peso_bulto_${id}" placeholder="0.00" min="0" step="0.01">
            </td>
            <td class="px-1 py-1">
                <select class="form-select form-select-sm" id="d_tipo_recepcion_${id}">
                    <option value="">—</option>
                    <option value="granel">Granel</option>
                    <option value="quintalado">Quintalado</option>
                    <option value="costal">Costal</option>
                </select>
            </td>
            <td class="px-1 py-1">
                <input type="number" class="form-control form-control-sm text-end"
                    id="d_humedad_${id}" placeholder="0.0" min="0" max="100" step="0.1">
            </td>
            <td class="px-1 py-1 text-center">
                <div class="form-check d-flex justify-content-center m-0">
                    <input type="checkbox" class="form-check-input" id="d_analisis_${id}">
                </div>
            </td>
            <td class="px-1 py-1">
                <select class="form-select form-select-sm" id="d_productor_${id}">
                    <option value="">—</option>
                    ${optsProductor}
                </select>
            </td>
            <td class="px-1 py-1">
                <select class="form-select form-select-sm" id="d_ejido_${id}">
                    <option value="">—</option>
                    ${optsEjido}
                </select>
            </td>
            <td class="px-1 py-1">
                <select class="form-select form-select-sm" id="d_predio_${id}">
                    <option value="">—</option>
                </select>
            </td>
            <td class="px-1 py-1 text-center">
                <button class="btn btn-sm btn-outline-danger" title="Eliminar fila"
                    onclick="eliminarFila(${id})">
                    <i class="fa-solid fa-trash" style="font-size:10px;"></i>
                </button>
            </td>`;

        tbody.appendChild(tr);

        // Agregar event listener después de insertar en el DOM
        // El onchange inline no siempre dispara correctamente en elementos dinámicos
        const ejidoSelect = document.getElementById(`d_ejido_${id}`);
        if (ejidoSelect) {
            ejidoSelect.addEventListener('change', () => filtrarPredios(id));
        }
    };

    // ─────────────────────────────────────────
    // ELIMINAR FILA
    // ─────────────────────────────────────────
    window.eliminarFila = function (id) {
        const fila = document.getElementById(`fila-${id}`);
        if (fila) { fila.remove(); calcularTotal(); }
    };

    // ─────────────────────────────────────────
    // FILTRAR PREDIOS SEGÚN EJIDO
    // ─────────────────────────────────────────
    window.filtrarPredios = function (id) {
        const ejidoVal  = document.getElementById(`d_ejido_${id}`)?.value;
        const selPredio = document.getElementById(`d_predio_${id}`);
        if (!selPredio) return;

        const prediosFiltrados = ejidoVal
            ? _predios.filter(p => String(p.fk_ejido) === String(ejidoVal))
            : [];

        selPredio.innerHTML = '<option value="">—</option>' +
            prediosFiltrados.map(p => `<option value="${p.pk_predio}">${p.nombre}</option>`).join('');
    };

    // Exponer _predios para diagnóstico desde consola
    window._getPredios = () => _predios;

    // ─────────────────────────────────────────
    // CALCULAR TOTAL KG
    // ─────────────────────────────────────────
    window.calcularTotal = function () {
        let total = 0;
        const inputs = document.querySelectorAll('[id^="d_kg_"]');
        inputs.forEach(input => {
            const v = parseFloat(input.value);
            if (!isNaN(v) && v > 0) total += v;
        });
        const el = document.getElementById('totalKg');
        if (el) el.textContent = total.toLocaleString('es-MX', { minimumFractionDigits: 2 });

        // Contar filas válidas
        const filas = document.querySelectorAll('#detalleBody tr').length;
        const elProd = document.getElementById('totalProductos');
        if (elProd) elProd.textContent = filas;

        // Badge líneas
        const badge = document.getElementById('badgeLineas');
        if (badge) badge.textContent = `${filas} línea${filas !== 1 ? 's' : ''}`;

        // Folio visual
        const tipo = document.getElementById('f_tipo_movimiento')?.value;
        if (tipo) generarFolioVisual(tipo);
    };

    // ─────────────────────────────────────────
    // RECOLECTAR DETALLES DEL FORMULARIO
    // ─────────────────────────────────────────
    function recolectarDetalles() {
        const filas = document.querySelectorAll('#detalleBody tr');
        const detalles = [];
        let valido = true;

        filas.forEach(fila => {
            const rowId          = fila.id.replace('fila-', '');
            const fk_producto    = document.getElementById(`d_producto_${rowId}`)?.value;
            const cantidad_kg    = document.getElementById(`d_kg_${rowId}`)?.value;
            const cantidad_bultos = document.getElementById(`d_bultos_${rowId}`)?.value;
            const peso_por_bulto = document.getElementById(`d_peso_bulto_${rowId}`)?.value;
            const tipo_recepcion = document.getElementById(`d_tipo_recepcion_${rowId}`)?.value;
            const humedad        = document.getElementById(`d_humedad_${rowId}`)?.value;
            const analisis       = document.getElementById(`d_analisis_${rowId}`)?.checked;
            const fk_productor   = document.getElementById(`d_productor_${rowId}`)?.value;
            const fk_ejido       = document.getElementById(`d_ejido_${rowId}`)?.value;
            const fk_predio      = document.getElementById(`d_predio_${rowId}`)?.value;

            if (!fk_producto || !cantidad_kg || parseFloat(cantidad_kg) <= 0) {
                valido = false;
                return;
            }

            detalles.push({
                fk_producto:      parseInt(fk_producto),
                cantidad_kg:      parseFloat(cantidad_kg),
                cantidad_bultos:  cantidad_bultos ? parseInt(cantidad_bultos)   : null,
                peso_por_bulto:   peso_por_bulto  ? parseFloat(peso_por_bulto) : null,
                tipo_recepcion:   tipo_recepcion  || null,
                humedad:          humedad         ? parseFloat(humedad)         : null,
                analisis_calidad: analisis || false,
                fk_productor:     fk_productor    ? parseInt(fk_productor)      : null,
                fk_ejido:         fk_ejido        ? parseInt(fk_ejido)          : null,
                fk_predio:        fk_predio       ? parseInt(fk_predio)         : null
            });
        });

        return { detalles, valido };
    }

    // ─────────────────────────────────────────
    // GUARDAR MOVIMIENTO (CREAR O ACTUALIZAR)
    // ─────────────────────────────────────────
    window.guardarMovimiento = async function () {
        const tipo_movimiento = document.getElementById('f_tipo_movimiento').value;
        const fk_bodega       = document.getElementById('f_fk_bodega').value;
        const motivo          = document.getElementById('f_motivo').value.trim();

        let valido = true;
        if (!tipo_movimiento) {
            document.getElementById('err_tipo').classList.remove('d-none');
            valido = false;
        } else {
            document.getElementById('err_tipo').classList.add('d-none');
        }
        if (!fk_bodega) {
            document.getElementById('err_bodega').classList.remove('d-none');
            valido = false;
        } else {
            document.getElementById('err_bodega').classList.add('d-none');
        }
        if (!valido) return;

        const filas = document.querySelectorAll('#detalleBody tr');
        if (!filas.length) {
            Swal.fire({ icon: 'warning', title: 'Sin productos',
                text: 'Agrega al menos un producto al movimiento' });
            return;
        }

        const { detalles, valido: detalleValido } = recolectarDetalles();

        if (!detalleValido || detalles.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Datos incompletos',
                text: 'Cada fila debe tener producto y cantidad mayor a 0' });
            return;
        }

        const payload = {
            tipo_movimiento,
            fk_bodega: parseInt(fk_bodega),
            motivo:    motivo || null,
            detalles
        };

        try {
            if (_idEditando) {
                await fetchWithAuth(`/movimiento_bodega/${_idEditando}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Movimiento actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/movimiento_bodega', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Movimiento registrado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.error || error.message });
        }
    };

    // ─────────────────────────────────────────
    // VER DETALLE
    // ─────────────────────────────────────────
    window.verDetalle = async function (id) {
        document.getElementById('detalleTitulo').textContent = 'Cargando…';
        document.getElementById('detalleModalBody').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" style="color:#1a3c5e;" role="status"></div>
            </div>`;
        new bootstrap.Modal(document.getElementById('modalDetalle')).show();

        try {
            const res = await fetchWithAuth(`/movimiento_bodega/${id}`);
            const m   = res.movimiento;
            const det = res.detalles;

            const year    = m.fecha ? new Date(m.fecha).getFullYear() : new Date().getFullYear();
            const numM    = String(m.pk_movimiento_bodega).padStart(3, '0');
            const folioM  = m.tipo_movimiento === 'entrada' ? `ENT-${year}-${numM}` : `SAL-${year}-${numM}`;
            const colorM  = m.tipo_movimiento === 'entrada' ? '#2d7a4f' : '#c0392b';
            const iconM   = m.tipo_movimiento === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up';

            // Colorear header del modal
            const modalHeader = document.getElementById('modalDetalleHeader');
            if (modalHeader) modalHeader.style.background = colorM;
            const modalIcon = document.getElementById('modalDetalleTipoIcon');
            if (modalIcon) { modalIcon.className = `fa-solid ${iconM} me-2`; }

            document.getElementById('detalleTitulo').textContent =
                `${m.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'} · ${folioM} · ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' }) : '—'}`;

            const totalKg = det.reduce((s, d) => s + parseFloat(d.cantidad_kg || 0), 0);
            const kgSign  = m.tipo_movimiento === 'entrada' ? '+' : '-';

            document.getElementById('detalleModalBody').innerHTML = `
                <div class="row g-2 mb-4 p-3 rounded-3" style="background:#f8fafc;border:1px solid #e9ecef;">
                    <div class="col-md-3 col-6">
                        <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Folio</div>
                        <div class="fw-bold" style="font-family:monospace;color:${colorM};">${folioM}</div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Bodega</div>
                        <div class="fw-semibold" style="color:#1a3c5e;">${m.bodega_nombre || '—'}</div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Fecha</div>
                        <div>${m.fecha ? new Date(m.fecha).toLocaleString('es-MX', { timeZone: 'America/Mazatlan' }) : '—'}</div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Registrado por</div>
                        <div>${m.registrado_por_usuario || '—'}</div>
                    </div>
                    ${m.motivo ? `
                    <div class="col-12">
                        <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Motivo</div>
                        <div>${m.motivo}</div>
                    </div>` : ''}
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-sm align-middle mb-0" style="font-size:12px;">
                        <thead style="background:#1a3c5e;color:#fff;font-size:11px;">
                            <tr>
                                <th class="px-3 py-2">PRODUCTO</th>
                                <th class="px-3 py-2 text-center">KG</th>
                                <th class="px-3 py-2 text-center">BULTOS</th>
                                <th class="px-3 py-2 text-center">KG/BULTO</th>
                                <th class="px-3 py-2 text-center">RECEPCIÓN</th>
                                <th class="px-3 py-2 text-center">HUMEDAD</th>
                                <th class="px-3 py-2 text-center">ANÁLISIS</th>
                                <th class="px-3 py-2">PRODUCTOR</th>
                                <th class="px-3 py-2">EJIDO</th>
                                <th class="px-3 py-2">PREDIO</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white">
                            ${det.map(d => `
                            <tr>
                                <td class="px-3">
                                    <div class="fw-semibold" style="color:#1a3c5e;">${d.producto_nombre || '—'}</div>
                                    <div class="text-muted" style="font-size:11px;">${d.variedad || ''}</div>
                                </td>
                                <td class="px-3 text-center fw-semibold" style="color:${colorM};">${kgSign}${parseFloat(d.cantidad_kg).toLocaleString('es-MX')} kg</td>
                                <td class="px-3 text-center">${d.cantidad_bultos ?? '—'}</td>
                                <td class="px-3 text-center">${d.peso_por_bulto ?? '—'}</td>
                                <td class="px-3 text-center">${d.tipo_recepcion || '—'}</td>
                                <td class="px-3 text-center">${d.humedad != null ? d.humedad + '%' : '—'}</td>
                                <td class="px-3 text-center">
                                    ${d.analisis_calidad
                                        ? '<i class="fa-solid fa-check text-success"></i>'
                                        : '<i class="fa-solid fa-xmark text-muted"></i>'}
                                </td>
                                <td class="px-3">${d.productor_nombre || '—'}</td>
                                <td class="px-3">${d.ejido_nombre || '—'}</td>
                                <td class="px-3">${d.predio_nombre || '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                        <tfoot style="background:#f8fafc;">
                            <tr>
                                <td class="px-3 fw-bold text-end" style="color:#1a3c5e;">TOTAL</td>
                                <td class="px-3 text-center fw-bold" style="color:${colorM};">
                                    ${kgSign}${totalKg.toLocaleString('es-MX')} kg
                                </td>
                                <td colspan="8"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;

        } catch (e) {
            document.getElementById('detalleModalBody').innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    Error al cargar el detalle
                </div>`;
        }
    };

    // ─────────────────────────────────────────
    // SWITCH TAB PRINCIPAL (Movimientos / Inventario)
    // ─────────────────────────────────────────
    window.switchTabPrincipal = function (tab) {
        const tMov = document.getElementById('tabMovimientos');
        const tInv = document.getElementById('tabInventario');
        const vMov = document.getElementById('vistaMovimientosTab');
        const vInv = document.getElementById('vistaInventarioTab');
        const btnNuevo = document.getElementById('btnNuevoMovimiento');

        if (tab === 'movimientos') {
            vMov.classList.remove('d-none'); vInv.classList.add('d-none');
            tMov.classList.add('active');    tInv.classList.remove('active');
            if (btnNuevo) btnNuevo.classList.remove('d-none');
        } else {
            // Si el formulario está abierto, cerrarlo antes de cambiar tab
            const vForm = document.getElementById('vistaFormulario');
            const vTabla = document.getElementById('vistaTabla');
            if (vForm && !vForm.classList.contains('d-none')) {
                resetFormulario();
                vForm.classList.add('d-none');
                if (vTabla) vTabla.classList.remove('d-none');
            }
            vMov.classList.add('d-none');    vInv.classList.remove('d-none');
            tMov.classList.remove('active'); tInv.classList.add('active');
            if (btnNuevo) btnNuevo.classList.add('d-none');
            cargarInvTab();
        }
    };

    // ─────────────────────────────────────────
    // CARGAR INVENTARIO TAB
    // ─────────────────────────────────────────
    window.cargarInvTab = async function () {
        const tabla = document.getElementById('invTabBody');
        if (!tabla) return;
        tabla.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data  = await fetchWithAuth('/inventario_bodega');
            _inventario = Array.isArray(data) ? data : [];
            poblarFiltrosInv(_inventario);
            renderTarjetasInv(_inventario);
            renderTablaInv(_inventario);
        } catch (e) {
            console.error('Error inventario:', e);
            tabla.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">
                Error al cargar el inventario</td></tr>`;
        }
    };

    function poblarFiltrosInv(data) {
        const selBodega = document.getElementById('invFiltroBodega');
        const selTipo   = document.getElementById('invFiltroTipo');
        if (!selBodega || !selTipo) return;
        const bodegas = [...new Set(data.map(i => i.bodega).filter(Boolean))].sort();
        const tipos   = [...new Set(data.map(i => i.tipo_grano).filter(Boolean))].sort();
        selBodega.innerHTML = '<option value="">Todas las bodegas</option>' +
            bodegas.map(b => `<option value="${b}">${b}</option>`).join('');
        selTipo.innerHTML = '<option value="">Todos los tipos</option>' +
            tipos.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    function renderTarjetasInv(data) {
        const cont = document.getElementById('invTarjetas');
        if (!cont) return;
        const porBodega = {};
        data.forEach(i => {
            if (!porBodega[i.bodega]) porBodega[i.bodega] = { total_kg: 0, productos: 0 };
            porBodega[i.bodega].total_kg  += parseFloat(i.stock_kg || 0);
            porBodega[i.bodega].productos += 1;
        });
        const totalGeneral = data.reduce((s, i) => s + parseFloat(i.stock_kg || 0), 0);
        cont.innerHTML = Object.entries(porBodega).map(([bodega, info]) => `
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <div style="width:36px;height:36px;border-radius:8px;background:#e8f0fe;
                                        display:flex;align-items:center;justify-content:center;">
                                <i class="fa-solid fa-house-chimney" style="color:#1a3c5e;font-size:14px;"></i>
                            </div>
                            <span class="fw-semibold text-truncate" style="color:#1a3c5e;font-size:13px;">${bodega}</span>
                        </div>
                        <div class="fw-bold" style="font-size:18px;color:#1a3c5e;">
                            ${parseFloat(info.total_kg).toLocaleString('es-MX')} kg
                        </div>
                        <div class="text-muted" style="font-size:11px;">${info.productos} producto${info.productos !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>`).join('') + `
            <div class="col-md-3 col-sm-6">
                <div class="card border-0 shadow-sm h-100" style="border-radius:10px;background:#1a3c5e;">
                    <div class="card-body p-3 text-white">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.15);
                                        display:flex;align-items:center;justify-content:center;">
                                <i class="fa-solid fa-boxes-stacked" style="font-size:14px;"></i>
                            </div>
                            <span class="fw-semibold" style="font-size:13px;">Total General</span>
                        </div>
                        <div class="fw-bold" style="font-size:18px;">${totalGeneral.toLocaleString('es-MX')} kg</div>
                        <div style="font-size:11px;opacity:.8;">${data.length} registro${data.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>`;
    }

    function badgeNivelInv(stock_kg) {
        const kg = parseFloat(stock_kg || 0);
        if (kg >= 1000) return `<span class="badge bg-success" style="font-size:11px;">Alto</span>`;
        if (kg >= 100)  return `<span class="badge bg-warning text-dark" style="font-size:11px;">Medio</span>`;
        return `<span class="badge bg-danger" style="font-size:11px;">Bajo</span>`;
    }

    function renderTablaInv(data) {
        const tabla = document.getElementById('invTabBody');
        const info  = document.getElementById('info-registros-inv-tab');
        if (!tabla) return;
        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">
                <i class="fa-solid fa-boxes-stacked fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                Sin registros de inventario</td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'invTabBody', filasPorPagina: 15, sufijo: 'inv-tab' });
            return;
        }
        if (info) info.textContent = `Mostrando ${data.length} de ${_inventario.length} registros`;
        tabla.innerHTML = data.map((i, idx) => {
            // % bodega
            const cap  = parseFloat(i.capacidad_kg || 0);
            const stk  = parseFloat(i.stock_kg || 0);
            const pct  = cap > 0 ? Math.min(100, Math.round((stk / cap) * 100)) : null;
            const pctColor = pct === null ? '#adb5bd'
                : pct >= 70 ? '#c0392b'
                : pct >= 30 ? '#e6a817'
                : '#2d7a4f';
            const barPct = pct !== null ? `
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="flex:1;height:6px;background:#e9ecef;border-radius:4px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:${pctColor};border-radius:4px;"></div>
                    </div>
                    <span style="font-size:11px;color:${pctColor};font-weight:600;min-width:30px;">${pct}%</span>
                </div>` : '<span class="text-muted" style="font-size:11px;">Sin cap.</span>';

            // Humedad
            const hum = i.humedad != null ? parseFloat(i.humedad) : null;
            const humColor = hum === null ? '#6c757d' : hum > 13 ? '#c0392b' : '#2d7a4f';
            const humIcon  = hum !== null && hum > 13 ? ' <i class="fa-solid fa-triangle-exclamation" style="color:#e6a817;font-size:10px;"></i>' : '';
            const humHtml  = hum !== null
                ? `<div style="color:${humColor};font-weight:600;font-size:13px;">${hum.toFixed(1)}%${humIcon}</div>
                   <div style="height:4px;background:#e9ecef;border-radius:4px;margin-top:2px;overflow:hidden;">
                       <div style="width:${Math.min(100, hum * 5)}%;height:100%;background:${humColor};border-radius:4px;"></div>
                   </div>`
                : '<span class="text-muted" style="font-size:11px;">—</span>';

            // Calidad
            const calidad = i.analisis_calidad === true
                ? `<span class="badge" style="background:#e8f5ee;color:#2d7a4f;border:1px solid #2d7a4f40;font-size:11px;">★ Buena</span>`
                : i.analisis_calidad === false && i.humedad !== null
                ? `<span class="badge" style="background:#fff8e1;color:#e6a817;border:1px solid #e6a81740;font-size:11px;">★ Regular</span>`
                : '<span class="text-muted" style="font-size:11px;">—</span>';

            // Último movimiento
            const ultFecha = i.fecha_mov
                ? new Date(i.fecha_mov).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan' })
                : null;
            const ultTipo = i.ultimo_tipo;
            const ultHtml = ultFecha
                ? `<div style="font-size:12px;">${ultFecha}</div>
                   <div style="font-size:11px;color:${ultTipo === 'entrada' ? '#2d7a4f' : '#c0392b'};">
                       ${ultTipo === 'entrada' ? '↓ Entrada' : '↑ Salida'}
                   </div>`
                : '<span class="text-muted" style="font-size:11px;">—</span>';

            return `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${idx + 1}</td>
                <td class="px-3 fw-semibold" style="color:#1a3c5e;font-size:13px;">${i.producto || '—'}</td>
                <td class="px-3 text-center" style="font-size:13px;">
                    ${i.tipo_grano
                        ? `<span class="badge bg-info text-dark" style="font-size:11px;">${i.tipo_grano}</span>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">${i.variedad || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${i.bodega || '—'}</td>
                <td class="px-3 text-center fw-semibold" style="font-size:13px;color:#1a3c5e;">
                    ${stk.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                </td>
                <td class="px-3" style="min-width:110px;">${barPct}</td>
                <td class="px-3">${humHtml}</td>
                <td class="px-3 text-center">${calidad}</td>
                <td class="px-3 text-center">${ultHtml}</td>
                <td class="px-3 text-center">${badgeNivelInv(i.stock_kg)}</td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-primary" title="Ver historial"
                        onclick="verDetalleProducto(${i.fk_producto || i.pk_inventario}, ${i.fk_bodega || 0}, '${(i.producto||'').replace(/'/g,'\'')}', '${(i.bodega||'').replace(/'/g,'\'')}')"
                        style="white-space:nowrap;">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        initPaginacion({ tbodyId: 'invTabBody', filasPorPagina: 15, sufijo: 'inv-tab' });
    }

    // ════════════════════════════════════════
    // ELIMINAR MOVIMIENTO
    // ════════════════════════════════════════
    window.eliminarMovimiento = async function (id) {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar movimiento?',
            html: '<p class="mb-1">Esta acción <strong>revertirá el stock</strong> asociado a este movimiento.</p><p class="text-muted small">No se puede deshacer.</p>',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#c0392b',
            cancelButtonColor: '#6c757d'
        });
        if (!confirm.isConfirmed) return;

        try {
            await fetchWithAuth(`/movimiento_bodega/${id}`, 'DELETE');
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Movimiento eliminado y stock revertido exitosamente', timer: 2000, showConfirmButton: false });
            listar();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.error || e.message });
        }
    };

    // ════════════════════════════════════════
    // VER DETALLE DE PRODUCTO EN INVENTARIO
    // ════════════════════════════════════════
    window.verDetalleProducto = async function (fk_producto, fk_bodega, producto, bodega) {
        // Buscar el registro de inventario
        const inv = _inventario.find(i => (i.fk_producto || i.pk_inventario) == fk_producto && (i.fk_bodega || 0) == fk_bodega)
            || _inventario.find(i => i.producto === producto && i.bodega === bodega)
            || {};

        const stk        = parseFloat(inv.stock_kg || 0);
        const cap        = parseFloat(inv.capacidad_kg || 0);
        const pct        = cap > 0 ? Math.min(100, Math.round((stk / cap) * 100)) : null;
        const hum        = inv.humedad != null ? parseFloat(inv.humedad) : null;
        const humColor   = hum === null ? '#6c757d' : hum > 13 ? '#c0392b' : '#2d7a4f';
        const calidad    = inv.analisis_calidad === true ? 'A' : inv.analisis_calidad === false && hum !== null ? 'B' : '—';
        const calidadTxt = inv.analisis_calidad === true ? 'Buena' : inv.analisis_calidad === false && hum !== null ? 'Regular' : '—';

        // Mostrar modal con loading
        const modalEl = document.getElementById('modalDetalleProducto');
        if (!modalEl) {
            // Crear modal dinámicamente si no existe
            const div = document.createElement('div');
            div.innerHTML = `
            <div class="modal fade" id="modalDetalleProducto" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius:14px;overflow:hidden;">
                        <div class="modal-header text-white py-3 px-4" id="modalProdHeader" style="background:#2d7a4f;">
                            <h5 class="modal-title">
                                <i class="fa-solid fa-seedling me-2"></i>
                                <span id="modalProdTitulo">Cargando...</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4" id="modalProdBody">
                            <div class="text-center py-4"><div class="spinner-border" style="color:#2d7a4f;"></div></div>
                        </div>
                        <div class="modal-footer bg-light border-top" id="modalProdFooter"></div>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(div.firstElementChild);
        }

        document.getElementById('modalProdTitulo').textContent = `${producto} · ${bodega}`;
        document.getElementById('modalProdBody').innerHTML = '<div class="text-center py-4"><div class="spinner-border" style="color:#2d7a4f;"></div></div>';
        document.getElementById('modalProdFooter').innerHTML = '';
        new bootstrap.Modal(document.getElementById('modalDetalleProducto')).show();

        try {
            // Obtener historial de movimientos de este producto en esta bodega
            const historial = await fetchWithAuth(`/movimiento_bodega/historial/${fk_producto}/${fk_bodega}`);

            document.getElementById('modalProdBody').innerHTML = `
                <!-- Tarjetas resumen -->
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-light h-100">
                            <div class="card-body p-3 text-center">
                                <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Stock Actual</div>
                                <div class="fw-bold" style="font-size:22px;color:#1a3c5e;">${stk.toLocaleString('es-MX')}</div>
                                <div class="text-muted" style="font-size:11px;">kilogramos</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-light h-100">
                            <div class="card-body p-3 text-center">
                                <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Humedad</div>
                                <div class="fw-bold" style="font-size:22px;color:${humColor};">
                                    ${hum !== null ? hum.toFixed(1) + '%' : '—'}
                                </div>
                                <div style="font-size:11px;color:${humColor};">${hum !== null ? (hum > 13 ? '⚠ Alta' : '✓ Nivel óptimo') : 'Sin datos'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-light h-100">
                            <div class="card-body p-3 text-center">
                                <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Calidad</div>
                                <div class="fw-bold" style="font-size:22px;color:#1a3c5e;">${calidad}</div>
                                <div class="text-muted" style="font-size:11px;">${calidadTxt}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-light h-100">
                            <div class="card-body p-3 text-center">
                                <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Ocupación Bodega</div>
                                <div class="fw-bold" style="font-size:22px;color:#1a3c5e;">${pct !== null ? pct + '%' : '—'}</div>
                                <div class="text-muted" style="font-size:11px;">${cap > 0 ? stk.toLocaleString('es-MX') + ' / ' + cap.toLocaleString('es-MX') + ' kg' : 'Sin capacidad'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historial -->
                <h6 class="fw-semibold mb-3" style="color:#1a3c5e;">
                    <i class="fa-solid fa-clock-rotate-left me-2"></i>Historial de movimientos
                </h6>
                ${historial.length ? `
                <div class="table-responsive">
                    <table class="table table-hover table-sm mb-0" style="font-size:12px;">
                        <thead style="background:#f8fafc;">
                            <tr>
                                <th class="px-3 py-2">Fecha</th>
                                <th class="px-3 py-2">Folio</th>
                                <th class="px-3 py-2 text-center">Tipo</th>
                                <th class="px-3 py-2 text-center">Cantidad</th>
                                <th class="px-3 py-2 text-center">Humedad</th>
                                <th class="px-3 py-2">Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historial.map(h => {
                                const color = h.tipo_movimiento === 'entrada' ? '#2d7a4f' : '#c0392b';
                                const signo = h.tipo_movimiento === 'entrada' ? '+' : '-';
                                return `<tr>
                                    <td class="px-3">${new Date(h.fecha).toLocaleDateString('es-MX')}</td>
                                    <td class="px-3"><span style="font-family:monospace;font-size:11px;">${h.folio}</span></td>
                                    <td class="px-3 text-center">${h.tipo_movimiento === 'entrada'
                                        ? '<span class="badge bg-success" style="font-size:10px;">↓ Entrada</span>'
                                        : '<span class="badge bg-danger"  style="font-size:10px;">↑ Salida</span>'}</td>
                                    <td class="px-3 text-center fw-semibold" style="color:${color};">${signo}${parseFloat(h.cantidad_kg).toLocaleString('es-MX')} kg</td>
                                    <td class="px-3 text-center">${h.humedad != null ? h.humedad + '%' : '—'}</td>
                                    <td class="px-3 text-muted">${h.motivo || '—'}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>` : '<p class="text-muted text-center py-3">Sin movimientos registrados para este producto en esta bodega.</p>'}
            `;

        } catch (e) {
            document.getElementById('modalProdBody').innerHTML =
                `<div class="text-center text-danger py-4">Error al cargar el historial</div>`;
        }
    };

    window.filtrarInvTab = function () {
        const q      = (document.getElementById('invSearch')?.value || '').toLowerCase();
        const bodega = document.getElementById('invFiltroBodega')?.value || '';
        const tipo   = document.getElementById('invFiltroTipo')?.value || '';
        const orden  = document.getElementById('invOrden')?.value || 'nombre';

        let filtrados = _inventario.filter(i => {
            const txt = `${i.producto || ''} ${i.variedad || ''}`.toLowerCase();
            return (!q || txt.includes(q))
                && (!bodega || i.bodega === bodega)
                && (!tipo   || i.tipo_grano === tipo);
        });

        if (orden === 'mayor') {
            filtrados.sort((a, b) => parseFloat(b.stock_kg) - parseFloat(a.stock_kg));
        } else if (orden === 'menor') {
            filtrados.sort((a, b) => parseFloat(a.stock_kg) - parseFloat(b.stock_kg));
        } else {
            filtrados.sort((a, b) => (a.producto || '').localeCompare(b.producto || ''));
        }

        renderTablaInv(filtrados);
    };

})();