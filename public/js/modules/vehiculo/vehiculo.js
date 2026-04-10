// ============================================
// JAVASCRIPT: vehiculo.js
// Descripción: Maneja la lógica del frontend para vehiculo
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
    const form = document.getElementById('formVehiculo');
    const tabla = document.getElementById('tablaVehiculo');

    // Cargar la lista de vehiculo al iniciar
    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Obtener valores del formulario
            const id = document.getElementById('pk_vehiculo').value;
            const numero_economico = document.getElementById('numero_economico').value;
            const tipo_vehiculo = document.getElementById('tipo_vehiculo').value;
            const marca = document.getElementById('marca').value;
            const modelo = document.getElementById('modelo').value;
            const anio = document.getElementById('anio').value;
            const ubicacion = document.getElementById('ubicacion').value;

            // Crear objeto
            const data = {
                numero_economico,
                tipo_vehiculo,
                marca,
                modelo,
                anio,
                ubicacion
            };

            try {
                if (id) {
                    await fetchWithAuth(`/vehiculo/${id}`, 'PUT', data);
                    alert('Vehiculo actualizado exitosamente');
                } else {
                    await fetchWithAuth('/vehiculo', 'POST', data);
                    alert('Vehiculo creado exitosamente');
                }

                form.reset();
                mostrarTabla();
                listar();

            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ========== LISTAR VEHICULO ==========
    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/vehiculo');

            tabla.innerHTML = '';

            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay vehiculo registrado</td>
                    </tr>
                `;
                return;
            }

            data.forEach(v => {
                tabla.innerHTML += `
                    <tr>
                        <td>${v.pk_vehiculo}</td>
                        <td>${v.numero_economico}</td>
                        <td>${v.tipo_vehiculo}</td>
                        <td>${v.marca || 'N/A'}</td>
                        <td>${v.modelo || 'N/A'}</td>
                        <td>${v.ubicacion}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="editar(${v.pk_vehiculo}, '${v.numero_economico}', '${v.tipo_vehiculo}', '${v.marca || ''}', '${v.modelo || ''}', '${v.anio || ''}', '${v.ubicacion}')">
                                 Editar
                            </button>
                            <button class="btn btn-sm btn-secondary"
                                onclick="desactivar(${v.pk_vehiculo})">
                                 Dar de Baja
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Paginación (igual que cliente)
            const footer = document.getElementById('footer-paginacion');
            if (footer && typeof initPaginacion === 'function') {
                const resFooter = await fetch('/views/partials/footer-table.html');
                footer.innerHTML = await resFooter.text();

                await new Promise(resolve => setTimeout(resolve, 10));

                initPaginacion({
                    tbodyId: 'tablaVehiculo',
                    filasPorPagina: 10
                });
            }

        } catch (error) {
            console.error('Error al listar vehiculo:', error);
            alert('Error al cargar vehiculo');
        }
    }

    // ========== EDITAR VEHICULO ==========
    window.editar = (id, numero, tipo, marca, modelo, anio, ubicacion) => {
        mostrarFormulario();

        document.getElementById('pk_vehiculo').value = id;
        document.getElementById('numero_economico').value = numero;
        document.getElementById('tipo_vehiculo').value = tipo;
        document.getElementById('marca').value = marca;
        document.getElementById('modelo').value = modelo;
        document.getElementById('anio').value = anio;
        document.getElementById('ubicacion').value = ubicacion;
    };

    // ========== DESACTIVAR VEHICULO ==========
    window.desactivar = async (id) => {
        if (!confirm('¿Desactivar este vehiculo?')) return;

        try {
            await fetchWithAuth(`/vehiculo/${id}/desactivar`, 'PATCH');
            alert('Vehiculo desactivado exitosamente');
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // ========== ELIMINAR VEHICULO ==========
    window.desaparecer = async (id) => {
        if (!confirm('¿Eliminar permanentemente este vehiculo?')) return;

        try {
            await fetchWithAuth(`/vehiculo/${id}`, 'DELETE');
            alert('Vehiculo eliminado exitosamente');
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
    const form = document.getElementById('formVehiculo');
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');
    const id = document.getElementById('pk_vehiculo');

    if (form) form.reset();
    if (id) id.value = '';
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};