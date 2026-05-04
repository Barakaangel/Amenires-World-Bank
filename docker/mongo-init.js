// MongoDB initialization script
// This script runs when the MongoDB container starts

// Switch to bankdb database
db = db.getSiblingDB('bankdb');

// Create collections
db.createCollection('users');
db.createCollection('accounts');
db.createCollection('transactions');
db.createCollection('loans');
db.createCollection('accountopenings');
db.createCollection('sessions');

// Create initial admin user with hashed password
// Password: admin123 (change this in production)
const hashedPassword = '$2a$10$rKJv5z5Yz5Yz5Yz5Yz5YzO'; // Placeholder - replace with actual hash

db.users.insertOne({
  name: 'System Administrator',
  email: 'admin@bank.com',
  password: hashedPassword,
  phone: '+1234567890',
  role: 'admin',
  status: 'active',
  createdAt: new Date(),
  kycVerified: true,
  kycVerifiedAt: new Date()
});

print('MongoDB initialization completed successfully');
