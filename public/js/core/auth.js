// ============================================
// JAVASCRIPT: auth.js
// Descripción: Funciones auxiliares de autenticación
// ============================================

// Obtener el token del storage
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Obtener datos del usuario actual
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return !!getToken();
}

// Verificar si el usuario tiene un rol específico
function hasRole(rolNombre) {
    const user = getCurrentUser();
    return user && user.rol === rolNombre;
}

// Verificar si el usuario es administrador
function isAdmin() {
    return hasRole('Administrador');
}

// ← NUEVO: Obtener módulos del usuario actual
function getModulos() {
    const user = getCurrentUser();
    return user?.modulos || [];
}

// ← NUEVO: Verificar si el usuario tiene acceso a un módulo
function hasModulo(clave) {
    return getModulos().includes(clave);
}

// Cerrar sesión
async function logout() {
    const token = getToken();
    
    try {
        await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('vista');
        window.top.location.href = '/views/auth/login.html';
    }
}

// Función para hacer peticiones con autenticación
async function fetchWithAuth(url, method = 'GET', data = null) {
    const token = getToken();
    
    if (!token) {
        window.top.location.href = '/views/auth/login.html';
        throw new Error('No hay token de autenticación');
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const res = await fetch(url, options);
        
        if (res.status === 401) {
            alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            logout();
            return;
        }

        if (res.status === 403) {
            const data = await res.json();
            alert(data.error || 'No tienes permisos para realizar esta acción');
            throw new Error('Acceso denegado');
        }

        const responseData = await res.json();

        if (!res.ok) {
            throw new Error(responseData.error || 'Error en la petición');
        }

        return responseData;

    } catch (error) {
        console.error('Error en fetchWithAuth:', error);
        throw error;
    }
}

// Verificar autenticación al cargar la página
function checkAuth() {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
    }
}