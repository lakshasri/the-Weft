const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

// Helper function to get user details with entity-specific info
const getUserWithEntityInfo = async (userRow) => {
  const { UserID, Email, Role } = userRow;
  let entityInfo = {};

  try {
    switch (Role) {
      case 'Customer':
        const [customerRows] = await pool.execute('SELECT * FROM Customers WHERE UserID = ?', [UserID]);
        if (customerRows.length) {
          entityInfo = { 
            CustomerID: customerRows[0].CustomerID,
            FullName: customerRows[0].FullName,
            Address: customerRows[0].Address,
            Phone: customerRows[0].Phone 
          };
        }
        break;
      case 'Manufacturer':
        const [mfgRows] = await pool.execute('SELECT * FROM Manufacturers WHERE UserID = ?', [UserID]);
        if (mfgRows.length) {
          entityInfo = { 
            ManufacturerID: mfgRows[0].ManufacturerID,
            FullName: mfgRows[0].CompanyName,
            Address: mfgRows[0].Address,
            Phone: mfgRows[0].Phone 
          };
        }
        break;
      case 'Retailer':
        const [retailerRows] = await pool.execute('SELECT * FROM Retailers WHERE UserID = ?', [UserID]);
        if (retailerRows.length) {
          entityInfo = { 
            RetailerID: retailerRows[0].RetailerID,
            FullName: retailerRows[0].BusinessName,
            Address: retailerRows[0].Address,
            Phone: retailerRows[0].Phone 
          };
        }
        break;
      case 'Distributor':
        const [distRows] = await pool.execute('SELECT * FROM Distributors WHERE UserID = ?', [UserID]);
        if (distRows.length) {
          entityInfo = { 
            DistributorID: distRows[0].DistributorID,
            FullName: distRows[0].CompanyName,
            Address: distRows[0].Address,
            Phone: distRows[0].Phone 
          };
        }
        break;
    }
  } catch (error) {
    console.error('Error fetching entity info:', error);
  }

  return {
    UserID,
    Email,
    Role,
    ...entityInfo
  };
};

exports.registerUser = async (req, res) => {
  const { Email, Password, FullName, Address, Role, Phone } = req.body;

  if (!Email || !Password || !Role || !FullName) {
    return res.status(400).json({ message: 'Email, password, role, and full name are required.' });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(Password, 10);
    
    // Insert into Users table
    const [userResult] = await connection.execute(
      `INSERT INTO Users (Email, Password, Role) VALUES (?, ?, ?)`,
      [Email, hashedPassword, Role]
    );

    const userId = userResult.insertId;
    let entityId;

    // Insert into role-specific table
    switch (Role) {
      case 'Customer':
        const [customerResult] = await connection.execute(
          `INSERT INTO Customers (UserID, FullName, Address, Phone) VALUES (?, ?, ?, ?)`,
          [userId, FullName, Address || null, Phone || null]
        );
        entityId = customerResult.insertId;
        break;
      case 'Manufacturer':
        const [mfgResult] = await connection.execute(
          `INSERT INTO Manufacturers (UserID, CompanyName, Address, Phone) VALUES (?, ?, ?, ?)`,
          [userId, FullName, Address || null, Phone || null]
        );
        entityId = mfgResult.insertId;
        break;
      case 'Retailer':
        const [retailerResult] = await connection.execute(
          `INSERT INTO Retailers (UserID, BusinessName, Address, Phone) VALUES (?, ?, ?, ?)`,
          [userId, FullName, Address || null, Phone || null]
        );
        entityId = retailerResult.insertId;
        break;
      case 'Distributor':
        const [distResult] = await connection.execute(
          `INSERT INTO Distributors (UserID, CompanyName, Address, Phone) VALUES (?, ?, ?, ?)`,
          [userId, FullName, Address || null, Phone || null]
        );
        entityId = distResult.insertId;
        break;
      default:
        throw new Error('Invalid role specified');
    }

    await connection.commit();

    const user = {
      UserID: userId,
      Email,
      Role,
      FullName,
      Address: Address || null,
      Phone: Phone || null,
      [`${Role}ID`]: entityId
    };

    return res.status(201).json({ success: true, user });
  } catch (error) {
    await connection.rollback();
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Failed to register user.' });
  } finally {
    connection.release();
  }
};

exports.loginUser = async (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE Email = ? AND IsActive = TRUE', [Email]);

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(Password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Get user with entity-specific information
    const userWithEntityInfo = await getUserWithEntityInfo(user);

    return res.status(200).json({ success: true, user: userWithEntityInfo });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Failed to login.' });
  }
};
