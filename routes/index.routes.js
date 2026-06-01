const express = require('express');
const router = express.Router();


router.get('/auth/login', (req, res) => {
    res.sendFile('views/auth/login.html', { root: 'public' });
});

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});


module.exports = router;