// ============================================
// JAVASCRIPT: clientes.js
// Descripción: Maneja la lógica del frontend para clientes
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
    const form = document.getElementById('formCliente');
    const tabla = document.getElementById('tablaClientes');

    // Cargar la lista de clientes al iniciar
    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevenir recarga de página

            // Obtener valores de los campos del formulario
            const id = document.getElementById('pk_cliente').value;
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;
            const direccion = document.getElementById('direccion').value;

            // Crear objeto con los datos
            const data = { nombre, email, telefono, direccion };

            try {
                // Determinar si es actualización o creación
                if (id) {
                    // PUT - Actualizar cliente existente
                    await fetchWithAuth(`/clientes/${id}`, 'PUT', data);
                    alert('Cliente actualizado exitosamente');
                } else {
                    // POST - Crear nuevo cliente
                    await fetchWithAuth('/clientes', 'POST', data);  // ← CORREGIDO: sin ${id}
                    alert('Cliente creado exitosamente');
                }

                // Limpiar formulario y recargar tabla
                form.reset();
                mostrarTabla();
                listar();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ========== LISTAR CLIENTES ==========
    async function listar() {
        if (!tabla) return; // Verificar que la tabla exista

        try {
            // Hacer petición GET al backend usando fetchWithAuth
            const data = await fetchWithAuth('/clientes');

            // Limpiar contenido anterior de la tabla
            tabla.innerHTML = '';

            // Verificar si hay clientes
            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No hay clientes registrados</td>
                    </tr>
                `;
                return;
            }

            // Iterar sobre cada cliente y crear una fila
            data.forEach(c => {
                tabla.innerHTML += `
                    <tr>
                        <td>${c.pk_cliente}</td>
                        <td>${c.nombre}</td>
                        <td>${c.email}</td>
                        <td>${c.telefono || 'N/A'}</td>
                        <td>${c.direccion || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="editar(${c.pk_cliente}, '${c.nombre}', '${c.email}', '${c.telefono || ''}', '${c.direccion || ''}')">
                                 Editar
                            </button>
                            <button class="btn btn-sm btn-secondary"
                                onclick="desactivar(${c.pk_cliente})">
                                 Desactivar
                            </button>
                            <button class="btn btn-sm btn-danger"
                                onclick="desaparecer(${c.pk_cliente})">
                                 Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Cargar el footer de paginación y luego inicializarla
            const footer = document.getElementById('footer-paginacion');
            if (footer && typeof initPaginacion === 'function') {
                const resFooter = await fetch('/views/partials/footer-table.html');
                footer.innerHTML = await resFooter.text();
                
                // Esperar un momento para que el DOM se actualice
                await new Promise(resolve => setTimeout(resolve, 10));
                
                // Inicializar paginación
                initPaginacion({
                    tbodyId: 'tablaClientes',
                    filasPorPagina: 10
                });
            }
        } catch (error) {
            console.error('Error al listar clientes:', error);
            alert('Error al cargar los clientes');
        }
    }

    // ========== EDITAR CLIENTE ==========
    // Función global para cargar datos en el formulario
    window.editar = (id, nombre, email, telefono, direccion) => {
        mostrarFormulario(); // Mostrar el formulario
        
        // Llenar los campos con los datos del cliente
        document.getElementById('pk_cliente').value = id;
        document.getElementById('nombre').value = nombre;
        document.getElementById('email').value = email;
        document.getElementById('telefono').value = telefono;
        document.getElementById('direccion').value = direccion;
    };

    // ========== DESACTIVAR CLIENTE (SOFT DELETE) ==========
    window.desactivar = async (id) => {
        // Confirmar acción
        if (!confirm('¿Desactivar este cliente?')) return;
        
        try {
            // PATCH - Cambiar estado a 0
            await fetchWithAuth(`/clientes/${id}/desactivar`, 'PATCH');  // ← CORREGIDO
            alert('Cliente desactivado exitosamente');
            
            // Recargar la lista
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // ========== ELIMINAR CLIENTE (HARD DELETE) ==========
    window.desaparecer = async (id) => {
        // Confirmar acción
        if (!confirm('¿Eliminar permanentemente este cliente? Esta acción no se puede deshacer.')) return;
        
        try {
            // DELETE - Eliminar de la base de datos
            await fetchWithAuth(`/clientes/${id}`, 'DELETE');  // ← CORREGIDO
            alert('Cliente eliminado exitosamente');
            
            // Recargar la lista
            listar();
        } catch (error) {
            // El error puede venir del backend si tiene pedidos asociados
            alert('Error: ' + error.message);
        }
    };

}, 100); // Timeout para asegurar que el DOM esté listo

// ========== FUNCIONES GLOBALES DE UI ==========

// Mostrar el formulario y ocultar la tabla
window.mostrarFormulario = function () {
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');

    if (f) f.classList.remove('d-none');
    if (t) t.classList.add('d-none');
    if (b) b.classList.remove('d-none');
};

// Mostrar la tabla y ocultar el formulario
window.mostrarTabla = function () {
    const form = document.getElementById('formCliente');
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');
    const id = document.getElementById('pk_cliente');

    if (form) form.reset(); // Limpiar formulario
    if (id) id.value = ''; // Limpiar ID oculto
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};