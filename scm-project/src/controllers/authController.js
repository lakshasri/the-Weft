const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

const sanitizeUser = (userRow) => ({
  UserID: userRow.UserID,
  FullName: userRow.FullName,
  Email: userRow.Email,
  Role: userRow.Role,
  Address: userRow.Address,
});

exports.registerUser = async (req, res) => {
  const { Email, Password, FullName, Address, Role } = req.body;

  if (!Email || !Password || !Role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(Password, 10);
    const [result] = await pool.execute(
      `INSERT INTO Users (Email, Password, FullName, Address, Role)
       VALUES (?, ?, ?, ?, ?)`,
      [Email, hashedPassword, FullName || null, Address || null, Role]
    );

    const user = {
      UserID: result.insertId,
      Email,
      FullName: FullName || null,
      Address: Address || null,
      Role,
    };

    return res.status(201).json({ success: true, user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Failed to register user.' });
  }
};

exports.loginUser = async (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [Email]);

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(Password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Failed to login.' });
  }
};
