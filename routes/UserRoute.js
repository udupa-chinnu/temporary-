const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('./dbConnect');

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

router.get('/',(req,res) => {
    res.render('Logging')
})

// Home Route
router.get('/home', requireAuth, async (req, res) => {
    res.render('home', { user: req.session.user });
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// Login Handler
router.post('/login', async (req, res) => {
    const { user_email, password } = req.body;

    if (!user_email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM user WHERE user_email = ?', [user_email]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.pass_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.user = {
            id: user.user_id,
            name: user.user_name,
            mail: user.user_email,
        };

        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register Handler
router.post('/register', async (req, res) => {
    const { user_name, gender, phone, user_email, password } = req.body;

    if (!user_name || !gender || !phone || !user_email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['m', 'f', 'o'].includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value.' });
    }

    try {
        const [existingUser] = await pool.query(
            'SELECT * FROM user WHERE user_email = ? OR phone = ?',
            [user_email, phone]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Email or phone already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO user (user_name, gender, phone, user_email, pass_hash) VALUES (?, ?, ?, ?, ?)',
            [user_name, gender, phone, user_email, hashedPassword]
        );

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve Vehicle Images
router.get('/vehicle-image/:id', async (req, res) => {
    const v_id = req.params.id;

    try {
        const [rows] = await pool.query('SELECT image FROM vehicle WHERE v_id = ?', [v_id]);
        if (rows.length > 0 && rows[0].image) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(rows[0].image, 'binary');
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving image');
    }
});

// Get Available Vehicles
router.get('/available-vehicles', async (req, res) => {
    try {
        const [vehicles] = await pool.query(
            'SELECT v_id, v_name, v_type, model_year, price, reg_no FROM vehicle WHERE availability = "available"'
        );
        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching available vehicles:', error);
        res.status(500).send('Server error');
    }
});

// Rent a Vehicle
router.post('/rent-vehicle/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;

    try {
        const [vehicle] = await pool.query('SELECT * FROM vehicle WHERE v_id = ? AND availability = "available"', [id]);

        if (vehicle.length === 0) {
            return res.status(400).json({ error: 'Vehicle not available' });
        }

        req.session.selectedVehicle = vehicle[0];
        // console.log("Session selectedvehicle : " ,req.session.selectedVehicle);
        
        res.redirect('/book-vehicle');
    } catch (error) {
        console.error('Error renting vehicle:', error);
        res.status(500).send('Server error');
    }
});

// Booking Page
router.get('/book-vehicle', requireAuth, (req, res) => {
    const vehicle = req.session.selectedVehicle;
    // console.log(vehicle);
    
    if (!vehicle) {
        return res.redirect('/home');
    }
    res.render('Booking', { vehicle, user: req.session.user });
});

// Add a Booking
router.post('/book-vehicle', requireAuth, async (req, res) => {
    const { destination, return_date, payment_method } = req.body;
    const userId = req.session.user.id;
    const vehicle = req.session.selectedVehicle;
    // console.log("inside booking",req.body);

    if (!destination || !return_date || !payment_method) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        await pool.query('START TRANSACTION');

        const [paymentResult] = await pool.query(
            'INSERT INTO payment (total_price, payment_method, payment_time) VALUES (?, "card", NOW())',
            [vehicle.price]
        );

        const payment_id = paymentResult.insertId;

        const [bookingResult] = await pool.query(
            'INSERT INTO booking (book_date, destination, price, return_date, booking_status, u_id, v_id,a_id, bookedAt, payment_id) VALUES (NOW(), ?, ?, ?, "booked", ?, ?, ?,NOW(), ?)',
            [destination, vehicle.price, return_date, userId, vehicle.v_id, vehicle.admin_id,payment_id]
        );

        await pool.query('UPDATE vehicle SET availability = "rented" WHERE v_id = ?', [vehicle.v_id]);

        await pool.query('COMMIT');

        req.session.selectedVehicle = null;
        // console.log(req.session.selectedVehicle);
        
        res.json({ success: true, message: 'Booking successful', book_id: bookingResult.insertId ,uid:userId});
    } catch (error) {
        console.error('Error during booking:', error);
        await pool.query('ROLLBACK');
        res.status(500).send('Server error during booking');
    }
});

// User Bookings
router.get('/user-bookings/:u_id', requireAuth, async (req, res) => {
    const { u_id } = req.params;

    try {
        const [bookings] = await pool.query(
            'SELECT b.book_id, b.book_date, b.destination, b.price, b.return_date, b.booking_status, v.v_name, v.v_type, p.total_price, p.payment_method FROM booking b JOIN vehicle v ON b.v_id = v.v_id JOIN payment p ON b.payment_id = p.pay_id WHERE b.u_id = ?',
            [u_id]
        );
        res.render('userBookingView',{bookings})
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).send('Server error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.redirect('/login');
    });
});

module.exports = router;
