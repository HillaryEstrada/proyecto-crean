// ============================================
// JAVASCRIPT: login.js
// Descripción: Maneja el login del sistema
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
    const mensaje = document.getElementById('mensaje');
    const btnLogin = document.getElementById('btnLogin');
    const btnTexto = document.getElementById('btnTexto');
    const btnSpinner = document.getElementById('btnSpinner');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Verificar si ya hay sesión activa
    verificarSesionActiva();

    // Toggle para mostrar/ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? 'Mostrar' : 'Ocultar';
        });
    }

    // Submit del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const credencial = document.getElementById('credencial').value.trim();
            const password = document.getElementById('password').value;
            const recordar = document.getElementById('recordar').checked;

            // Validación básica
            if (!credencial || !password) {
                mostrarMensaje('Por favor completa todos los campos', 'danger');
                return;
            }

            // Deshabilitar botón y mostrar spinner
            btnLogin.disabled = true;
            btnTexto.classList.add('d-none');
            btnSpinner.classList.remove('d-none');
            mensaje.classList.add('d-none');

            try {
                const res = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credencial, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Error al iniciar sesión');
                }

                // Guardar token en localStorage o sessionStorage
                if (recordar) {
                    localStorage.setItem('token', data.token);
                } else {
                    sessionStorage.setItem('token', data.token);
                }

                // Guardar datos del usuario
                localStorage.setItem('user', JSON.stringify(data.user));

                // Mostrar mensaje de éxito
                mostrarMensaje(`¡Bienvenido ${data.user.nombre}!`, 'success');

                // Redirigir al sistema usando replace para evitar historial
                setTimeout(() => {
                    window.location.replace('/');
                }, 1000);

            } catch (error) {
                mostrarMensaje(error.message, 'danger');
                
                // Rehabilitar botón
                btnLogin.disabled = false;
                btnTexto.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
            }
        });
    }

    // Función para mostrar mensajes
    function mostrarMensaje(texto, tipo) {
        if (mensaje) {
            mensaje.textContent = texto;
            mensaje.className = `alert alert-${tipo}`;
            mensaje.classList.remove('d-none');
        }
    }
});

// Verificar si ya hay una sesión activa
async function verificarSesionActiva() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) return;

    try {
        const res = await fetch('/auth/verificar', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            // Ya hay sesión activa, redirigir al sistema
            window.location.replace('/');
        }
    } catch (error) {
        // Token inválido, limpiar storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('vista');
    }
}