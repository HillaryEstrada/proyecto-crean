const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ejemplos/productos.controller');


router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);

/* 
Regla CLAVE de Express
No puedes tener dos rutas con el mismo método y el mismo path
*/
//router.delete('/:id', controller.desactivar);
//router.delete('/:id', controller.desaparecer);


// Soft delete
router.patch('/:id/desactivar', controller.desactivar);

// Hard delete
router.delete('/:id', controller.desaparecer);


module.exports = router;