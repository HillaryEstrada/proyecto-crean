
setTimeout(() => {

    // VERIFICAR AUTENTICACIÓN
    if (!isAuthenticated()) {
        window.location.href = '/views/auth/login.html';
        return;
    }

    // Obtener referencias a elementos del DOM
    const form = document.getElementById('formProducto');
    const tabla = document.getElementById('tablaProductos');

    // Cargar la lista de productos al iniciar
    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('id').value;
            const nombre = document.getElementById('nombre').value;
            const precio = document.getElementById('precio').value;
            const data = { nombre, precio };

            try {
                if (id) {
                    // PUT - Actualizar producto existente
                    await fetchWithAuth(`/productos/${id}`, 'PUT', data);
                    alert('Producto actualizado exitosamente');
                } else {
                    // POST - Crear nuevo producto
                    await fetchWithAuth('/productos', 'POST', data);
                    alert('Producto creado exitosamente');
                    Swal.fire({
                    title: "Producto creado exitosamente",
                    icon: "success",
                    draggable: true
                    });
                }

                form.reset();
                mostrarTabla();
                listar();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ========== LISTAR PRODUCTOS ==========
    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/productos');

            tabla.innerHTML = '';

            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay productos registrados</td>
                    </tr>
                `;
                return;
            }

            data.forEach(p => {
                tabla.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.nombre}</td>
                        <td>$${parseFloat(p.precio).toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="editar(${p.id}, '${p.nombre}',  ${p.precio})">
                                 Editar
                            </button>
                            <button class="btn btn-sm btn-secondary"
                                onclick="desactivar(${p.id})">
                                 Desactivar
                            </button>
                            <button class="btn btn-sm btn-danger"
                                onclick="desaparecer(${p.id})">
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
                    tbodyId: 'tablaProductos',
                    filasPorPagina: 10
                });
            }
        } catch (error) {
            console.error('Error al listar productos:', error);
            alert('Error al cargar los productos');
        }
    }

    // ========== EDITAR PRODUCTO ==========
    window.editar = (id, nombre,  precio) => {
        mostrarFormulario();
        document.getElementById('id').value = id;
        document.getElementById('nombre').value = nombre;
        document.getElementById('precio').value = precio;
    };

    // ========== DESACTIVAR PRODUCTO ==========
    window.desactivar = async (id) => {
        if (!confirm('¿Desactivar este producto?')) return;
        
        try {
            await fetchWithAuth(`/productos/${id}/desactivar`, 'PATCH');
            alert('Producto desactivado exitosamente');
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // ========== ELIMINAR PRODUCTO ==========
    window.desaparecer = async (id) => {
        if (!confirm('¿Eliminar permanentemente este producto? Esta acción no se puede deshacer.')) return;
        
        try {
            await fetchWithAuth(`/productos/${id}`, 'DELETE');
            alert('Producto eliminado exitosamente');
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
    const form = document.getElementById('formProducto');
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');
    const id = document.getElementById('id');

    if (form) form.reset();
    if (id) id.value = '';
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};