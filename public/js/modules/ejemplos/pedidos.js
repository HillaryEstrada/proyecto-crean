// ============================================
// JAVASCRIPT: pedidos.js
// Descripción: Maneja la lógica del frontend para pedidos
// ============================================

setTimeout(() => {

    // VERIFICAR AUTENTICACIÓN
    if (!isAuthenticated()) {
        window.location.href = '/views/auth/login.html';
        return;
    }

    // VERIFICAR ROL (solo administradores)
    if (!isAdmin()) {
        alert('Solo los administradores pueden acceder a esta sección');
        cargarVista('inicio');
        return;
    }

    // Obtener referencias a elementos del DOM
    const form = document.getElementById('formPedido');
    const tabla = document.getElementById('tablaPedidos');

    // Cargar la lista de pedidos al iniciar
    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_pedido').value;
            const fk_cliente = document.getElementById('fk_cliente').value;
            const fecha_pedido = document.getElementById('fecha_pedido').value;
            const total = document.getElementById('total').value;
            const estado = document.getElementById('estado').value;

            const data = { fk_cliente, fecha_pedido, total, estado };

            try {
                if (id) {
                    // PUT - Actualizar pedido existente
                    await fetchWithAuth(`/pedidos/${id}`, 'PUT', data);
                    alert('Pedido actualizado exitosamente');
                } else {
                    // POST - Crear nuevo pedido
                    await fetchWithAuth('/pedidos', 'POST', data);
                    alert('Pedido creado exitosamente');
                }

                form.reset();
                mostrarTabla();
                listar();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ========== LISTAR PEDIDOS ==========
    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/pedidos');

            tabla.innerHTML = '';

            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No hay pedidos registrados</td>
                    </tr>
                `;
                return;
            }

            data.forEach(p => {
                const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-MX');
                const estadoBadge = p.estado === 'Pendiente' 
                    ? '<span class="badge bg-warning">Pendiente</span>'
                    : p.estado === 'Completado'
                    ? '<span class="badge bg-success">Completado</span>'
                    : '<span class="badge bg-danger">Cancelado</span>';

                tabla.innerHTML += `
                    <tr>
                        <td>${p.pk_pedido}</td>
                        <td>${p.cliente_nombre || 'N/A'}</td>
                        <td>${fecha}</td>
                        <td>$${parseFloat(p.total).toFixed(2)}</td>
                        <td>${estadoBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="editar(${p.pk_pedido}, ${p.fk_cliente}, '${p.fecha_pedido}', ${p.total}, '${p.estado}')">
                                 Editar
                            </button>
                            <button class="btn btn-sm btn-secondary"
                                onclick="desactivar(${p.pk_pedido})">
                                 Desactivar
                            </button>
                            <button class="btn btn-sm btn-danger"
                                onclick="desaparecer(${p.pk_pedido})">
                                 Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Cargar paginación
            const footer = document.getElementById('footer-paginacion');
            if (footer && typeof initPaginacion === 'function') {
                const resFooter = await fetch('/views/partials/footer-table.html');
                footer.innerHTML = await resFooter.text();
                await new Promise(resolve => setTimeout(resolve, 10));
                initPaginacion({
                    tbodyId: 'tablaPedidos',
                    filasPorPagina: 10
                });
            }
        } catch (error) {
            console.error('Error al listar pedidos:', error);
            alert('Error al cargar los pedidos');
        }
    }

    // ========== EDITAR PEDIDO ==========
    window.editar = (id, fk_cliente, fecha_pedido, total, estado) => {
        mostrarFormulario();
        
        document.getElementById('pk_pedido').value = id;
        document.getElementById('fk_cliente').value = fk_cliente;
        document.getElementById('fecha_pedido').value = fecha_pedido.split('T')[0];
        document.getElementById('total').value = total;
        document.getElementById('estado').value = estado;
    };

    // ========== DESACTIVAR PEDIDO ==========
    window.desactivar = async (id) => {
        if (!confirm('¿Desactivar este pedido?')) return;
        
        try {
            await fetchWithAuth(`/pedidos/${id}/desactivar`, 'PATCH');
            alert('Pedido desactivado exitosamente');
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // ========== ELIMINAR PEDIDO ==========
    window.desaparecer = async (id) => {
        if (!confirm('¿Eliminar permanentemente este pedido? Esta acción no se puede deshacer.')) return;
        
        try {
            await fetchWithAuth(`/pedidos/${id}`, 'DELETE');
            alert('Pedido eliminado exitosamente');
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

}, 100);

// ========== FUNCIONES GLOBALES DE UI ==========
window.mostrarFormulario = function () {
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');

    if (f) f.classList.remove('d-none');
    if (t) t.classList.add('d-none');
    if (b) b.classList.remove('d-none');
};

window.mostrarTabla = function () {
    const form = document.getElementById('formPedido');
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');
    const id = document.getElementById('pk_pedido');

    if (form) form.reset();
    if (id) id.value = '';
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};