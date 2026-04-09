// ============================================
// JAVASCRIPT: users.js
// Descripción: Maneja el CRUD de usuarios
// ============================================

setTimeout(() => {
    // Verificar que el usuario sea administrador
    if (!isAdmin()) {
        alert('Solo los administradores pueden acceder a esta sección');
        cargarVista('inicio');
        return;
    }

    const form = document.getElementById('formUser');
    const tabla = document.getElementById('tablaUsers');
    const selectRol = document.getElementById('fk_rol');
    const checkCambiarPassword = document.getElementById('cambiar_password');
    const contenedorNuevaPassword = document.getElementById('contenedorNuevaPassword');
    const seccionPasswordNuevo = document.getElementById('seccionPasswordNuevo');
    const seccionPasswordEditar = document.getElementById('seccionPasswordEditar');

    // Mostrar información del usuario actual
    const user = getCurrentUser();
    if (user) {
        document.getElementById('usuarioActual').textContent = user.username;
        document.getElementById('rolActual').textContent = user.rol;
    }

    // Cargar roles y usuarios
    cargarRoles();
    listar();

    // Evento para checkbox de cambiar contraseña
    if (checkCambiarPassword) {
        checkCambiarPassword.addEventListener('change', (e) => {
            if (e.target.checked) {
                contenedorNuevaPassword.classList.remove('d-none');
                document.getElementById('nueva_password').required = true;
            } else {
                contenedorNuevaPassword.classList.add('d-none');
                document.getElementById('nueva_password').required = false;
                document.getElementById('nueva_password').value = '';
            }
        });
    }

    // Submit del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_user').value;
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const nombre_completo = document.getElementById('nombre_completo').value.trim();
            const fk_rol = document.getElementById('fk_rol').value;

            const data = { username, email, nombre_completo, fk_rol };

            try {
                if (id) {
                    // Modo edición
                    const cambiar_password = document.getElementById('cambiar_password').checked;
                    const nueva_password = document.getElementById('nueva_password').value;

                    if (cambiar_password) {
                        if (!nueva_password || nueva_password.length < 6) {
                            alert('La nueva contraseña debe tener al menos 6 caracteres');
                            return;
                        }
                        data.cambiar_password = true;
                        data.nueva_password = nueva_password;
                    }

                    await fetchWithAuth(`/users/${id}`, 'PUT', data);
                    alert('Usuario actualizado exitosamente');
                } else {
                    // Modo creación
                    const password = document.getElementById('password').value;
                    
                    if (!password || password.length < 6) {
                        alert('La contraseña debe tener al menos 6 caracteres');
                        return;
                    }

                    data.password = password;
                    await fetchWithAuth('/users', 'POST', data);
                    Swal.fire({
                    title: "Usuario Creado",
                    icon: "success",
                    draggable: true
                    });
                }

               form.reset(); 
                /*  mostrarTablaUser();*/
                listar();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Cargar roles en el select
    async function cargarRoles() {
        try {
            const data = await fetchWithAuth('/roles');
            selectRol.innerHTML = '<option value="">Selecciona un rol...</option>';
            data.forEach(rol => {
                selectRol.innerHTML += `<option value="${rol.pk_rol}">${rol.nombre}</option>`;
            });
        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    }

    // Listar usuarios
    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/users');

            tabla.innerHTML = '';

            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay usuarios registrados</td>
                    </tr>
                `;
                return;
            }

            data.forEach(u => {
                const ultimoAcceso = u.ultimo_acceso 
                    ? new Date(u.ultimo_acceso).toLocaleString('es-MX')
                    : 'Nunca';

                const badgeRol = u.rol_nombre === 'Administrador' 
                    ? '<span class="badge bg-danger">Admin</span>'
                    : '<span class="badge bg-info">Cliente</span>';

                tabla.innerHTML += `
                    <tr>
                        <td>${u.pk_user}</td>
                        <td><strong>${u.username}</strong></td>
                        <td>${u.email}</td>
                        <td>${u.nombre_completo}</td>
                        <td>${badgeRol}</td>
                        <td><small>${ultimoAcceso}</small></td>
                        <td>
                            <button class="btn btn-sm btn-warning" 
                                onclick="editarUser(${u.pk_user}, '${u.username}', '${u.email}', '${u.nombre_completo}', ${u.fk_rol})">
                                 Editar
                            </button>
                            <button class="btn btn-sm btn-secondary" 
                                onclick="desactivarUser(${u.pk_user})">
                                 Desactivar
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                onclick="desaparecerUser(${u.pk_user})">
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
                    tbodyId: 'tablaUsers',
                    filasPorPagina: 10
                });
            }
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            alert('Error al cargar los usuarios');
        }
    }

    // Editar usuario (función global)
    window.editarUser = (id, username, email, nombre, rolId) => {
        mostrarFormularioUser();
        
        document.getElementById('tituloFormUser').textContent = 'Editar Usuario';
        document.getElementById('pk_user').value = id;
        document.getElementById('username').value = username;
        document.getElementById('email').value = email;
        document.getElementById('nombre_completo').value = nombre;
        document.getElementById('fk_rol').value = rolId;

        // Mostrar sección de editar contraseña
        seccionPasswordNuevo.classList.add('d-none');
        seccionPasswordEditar.classList.remove('d-none');
        document.getElementById('password').required = false;
    };

    // Desactivar usuario
    window.desactivarUser = async (id) => {
        if (!confirm('¿Desactivar este usuario? No podrá iniciar sesión.')) return;
        
        try {
            await fetchWithAuth(`/users/${id}/desactivar`, 'PATCH');
            alert('Usuario desactivado exitosamente');
            listar();
        } catch (error) {
            alert(error.message);
        }
    };

    // Eliminar usuario permanentemente
    window.desaparecerUser = async (id) => {
        if (!confirm('¿Eliminar permanentemente este usuario? Esta acción no se puede deshacer.')) return;
        
        try {
            await fetchWithAuth(`/users/${id}`, 'DELETE');
            alert('Usuario eliminado permanentemente');
            listar();
        } catch (error) {
            alert(error.message);
        }
    };

}, 100);

// Mostrar formulario de usuario
window.mostrarFormularioUser = function () {
    const f = document.getElementById('contenedorFormularioUser');
    const t = document.getElementById('contenedorTablaUser');
    const b = document.getElementById('btnCancelarUser');
    const form = document.getElementById('formUser');
    const seccionPasswordNuevo = document.getElementById('seccionPasswordNuevo');
    const seccionPasswordEditar = document.getElementById('seccionPasswordEditar');

    if (form) form.reset();
    document.getElementById('pk_user').value = '';
    document.getElementById('tituloFormUser').textContent = 'Crear Nuevo Usuario';
    
    // Mostrar sección de crear contraseña
    seccionPasswordNuevo.classList.remove('d-none');
    seccionPasswordEditar.classList.add('d-none');
    document.getElementById('password').required = true;

    if (f) f.classList.remove('d-none');
    if (t) t.classList.add('d-none');
    if (b) b.classList.remove('d-none');
};

// Mostrar tabla de usuarios
window.mostrarTablaUser = function () {
    const form = document.getElementById('formUser');
    const f = document.getElementById('contenedorFormularioUser');
    const t = document.getElementById('contenedorTablaUser');
    const b = document.getElementById('btnCancelarUser');

    if (form) form.reset();
    document.getElementById('pk_user').value = '';
    
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};