const express = require('express');
const router = express.Router();
const pool = require('./dbConnect');
const bcrypt = require('bcrypt');
const multer = require('multer')


const requireAuth = (req, res, next) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    next();
  };
  


router.get('/login',(req,res) => {
    res.render('adminLogin');
})

router.get('/register',(req,res) => {
    res.render('adminRegister');
})

router.get('/dashboard',requireAuth,async(req,res)=>{
    try {
        const [vehicles] = await pool.query('SELECT * FROM vehicle WHERE admin_id = ?', [req.session.admin.id]);
        //console.log(vehicles);
        
        res.render('adminDash', { user: req.session.admin, vehicles });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
})


router.post('/login',async(req,res) => {
    const { admin_email, password } = req.body;

  // Validate input
  if (!admin_email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find admin by email
    const [rows] = await pool.query('SELECT * FROM admin WHERE admin_email = ?', [admin_email]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'admin not found' });
    }

    // Compare password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, admin.pass_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log(admin);
    
    //add session
    req.session.admin = {
        id:admin.admin_id,
        name: admin.admin_name,
        mail: admin.admin_email
      }

    res.redirect('/admin/dashboard');
    // Respond with a success message (or generate a token for authentication)
    //res.json({ message: 'Login successful', admin: { id: admin.id, name: admin.admin_name, email: admin.admin_email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
})

router.post('/register',async(req,res) => {
    const { admin_name, gender, phone, admin_email, password } = req.body;

  // Validate required fields
  if (!admin_name || !gender || !phone || !admin_email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate gender input
  if (!['m', 'f', 'o'].includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value. Must be "m", "f", or "o".' });
  }

  try {
    // Check if email or phone already exists
    const [existingadmin] = await pool.query(
      'SELECT * FROM admin WHERE admin_email = ? OR phone = ?',
      [admin_email, phone]
    );
    if (existingadmin.length > 0) {
      return res.status(409).json({ error: 'Email or phone already in use' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new admin into the database
    await pool.query(
      'INSERT INTO admin (admin_name, gender, phone, admin_email, pass_hash) VALUES (?, ?, ?, ?, ?)',
      [admin_name, gender, phone, admin_email, hashedPassword]
    );

    res.redirect('/admin/login');
    //res.status(201).json({ message: 'admin registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
})


// ADD VEHICLE

router.get('/add-vehicle',requireAuth,(req,res) => {
    res.render('adminAddVehicle')
})
// Multer setup for image upload
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage });

// Add Vehicle Route
router.post('/add-vehicle', upload.single('image'), async (req, res) => {
    const { v_name, v_type, model_year, availability, price, reg_no } = req.body;
    const image = req.file ? req.file.buffer : null; // Get image as buffer
    const admin_id = req.session.admin.id; // Get admin ID from session

    try {
        await pool.query(
            `INSERT INTO vehicle (v_name, v_type, model_year, availability, price, image, admin_id, reg_no, addedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [v_name, v_type, model_year, availability, price, image, admin_id, reg_no]
        );
        res.redirect('/admin/dashboard'); // Redirect to dashboard after adding
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add vehicle');
    }
});

router.delete('/delete-vehicle/:id', async (req, res) => {
    const admin_id = req.session.admin.id; // Admin ID from session
    const v_id = req.params.id;

    console.log(admin_id , v_id);
    

    try {
        const result = await pool.query(
            `DELETE FROM vehicle WHERE v_id = ? AND admin_id = ?`,
            [v_id, admin_id]
        );

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.get('/vehicles', async (req, res) => {
    const admin_id = req.session.admin.id;

    try {
        const [vehicles] = await pool.query(
            `SELECT v_id, v_name, v_type, model_year, availability, price, addedAt, reg_no 
             FROM vehicle WHERE admin_id = ?`,
            [admin_id]
        );
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch vehicles');
    }
});


router.get('/vehicle-image/:id', async (req, res) => {
  const v_id = req.params.id;

  try {
      const [rows] = await pool.query(`SELECT image FROM vehicle WHERE v_id = ?`, [v_id]);
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


router.get('/update-vehicle/:id',requireAuth,async(req,res) => {
  const { id } = req.params
  try {
    const [rows] = await pool.query('SELECT * FROM vehicle WHERE v_id = ?', [id]);
    if (rows.length === 0) {
        return res.status(404).send('Vehicle not found');
    }
    
    res.render('adminEditVehicle', { vehicle: rows[0] });
} catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).send('Server error');
}

})

// Admin: Update Vehicle Details
router.put('/update-vehicle/:id', requireAuth, async (req, res) => {
  const { id } = req.params; // Vehicle ID
  const { v_name, v_type, model_year, price, reg_no, availability } = req.body;

  const validStatuses = ['available', 'rented', 'maintanance']; // Allowed statuses

  try {
      // Check if the admin is authorized to edit this vehicle
      const [vehicle] = await pool.query('SELECT admin_id FROM vehicle WHERE v_id = ?', [id]);
      // if (!vehicle.length || vehicle[0].admin_id !== req.session.user.id) {
      //     return res.status(403).json({ error: 'Unauthorized access' });
      // }

      // Validate availability
      if (availability && !validStatuses.includes(availability)) {
          return res.status(400).json({
              error: `Invalid availability status. Allowed statuses: ${validStatuses.join(', ')}`,
          });
      }

      // Update vehicle details
      await pool.query(
          'UPDATE vehicle SET v_name = ?, v_type = ?, model_year = ?, price = ?, reg_no = ?, availability = ? WHERE v_id = ?',
          [v_name, v_type, model_year, price, reg_no, availability, id]
      );

      res.json({ success: true, message: 'Vehicle details updated successfully' });
  } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Server error' });
  }
});



router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.redirect('/admin/login'); // Redirect to login page
    });
});



module.exports = router;