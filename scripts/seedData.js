const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@bank.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      status: 'active',
      dateOfBirth: new Date('1980-01-01'),
      nationalId: 'ADMIN001',
      address: {
        street: '123 Bank Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      employmentStatus: 'employed',
      monthlyIncome: 10000,
      kycVerified: true,
      kycVerifiedAt: new Date(),
      accounts: []
    });
    console.log('✓ Admin user created');

    // Create staff users
    const staff1 = await User.create({
      name: 'John Smith',
      email: 'john.staff@bank.com',
      password: hashedPassword,
      phone: '+1234567891',
      role: 'staff',
      status: 'active',
      dateOfBirth: new Date('1985-05-15'),
      nationalId: 'STAFF001',
      address: {
        street: '456 Staff Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      },
      employmentStatus: 'employed',
      monthlyIncome: 5000,
      kycVerified: true,
      kycVerifiedAt: new Date(),
      accounts: []
    });
    console.log('✓ Staff user created (John)');

    const staff2 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah.staff@bank.com',
      password: hashedPassword,
      phone: '+1234567892',
      role: 'staff',
      status: 'active',
      dateOfBirth: new Date('1990-03-20'),
      nationalId: 'STAFF002',
      address: {
        street: '789 Staff Blvd',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        country: 'USA'
      },
      employmentStatus: 'employed',
      monthlyIncome: 5000,
      kycVerified: true,
      kycVerifiedAt: new Date(),
      accounts: []
    });
    console.log('✓ Staff user created (Sarah)');

    // Create regular users with accounts
    const userData = [
      {
        name: 'Alice Williams',
        email: 'alice@example.com',
        phone: '+1234567893',
        dateOfBirth: new Date('1992-08-10'),
        nationalId: 'USER001',
        city: 'Manhattan',
        state: 'NY',
        zip: '10003',
        income: 7500,
        balance: 5000
      },
      {
        name: 'Bob Brown',
        email: 'bob@example.com',
        phone: '+1234567894',
        dateOfBirth: new Date('1988-12-25'),
        nationalId: 'USER002',
        city: 'Queens',
        state: 'NY',
        zip: '11375',
        income: 6000,
        balance: 10000
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        phone: '+1234567895',
        dateOfBirth: new Date('1995-04-18'),
        nationalId: 'USER003',
        city: 'Bronx',
        state: 'NY',
        zip: '10451',
        income: 4500,
        balance: 2500
      },
      {
        name: 'Diana Miller',
        email: 'diana@example.com',
        phone: '+1234567896',
        dateOfBirth: new Date('1990-09-30'),
        nationalId: 'USER004',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11215',
        income: 8000,
        balance: 15000
      },
      {
        name: 'Edward Wilson',
        email: 'edward@example.com',
        phone: '+1234567897',
        dateOfBirth: new Date('1987-02-14'),
        nationalId: 'USER005',
        city: 'Staten Island',
        state: 'NY',
        zip: '10301',
        income: 9000,
        balance: 20000
      }
    ];

    const createdUsers = [];

    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      const accountNumber = `ACC${1000 + i}${Date.now().toString().slice(-4)}`;
      const accountNumber2 = `ACC${2000 + i}${Date.now().toString().slice(-4)}`;

      const newUser = await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        role: 'customer',
        status: 'active',
        dateOfBirth: user.dateOfBirth,
        nationalId: user.nationalId,
        address: {
          street: `${(i + 1) * 123} Customer Street`,
          city: user.city,
          state: user.state,
          zipCode: user.zip,
          country: 'USA'
        },
        employmentStatus: 'employed',
        monthlyIncome: user.income,
        kycVerified: true,
        kycVerifiedAt: new Date(),
        accounts: [
          {
            type: 'checking',
            accountNumber: accountNumber,
            balance: user.balance,
            currency: 'USD',
            status: 'active',
            createdAt: new Date()
          },
          {
            type: 'savings',
            accountNumber: accountNumber2,
            balance: user.balance * 0.5,
            currency: 'USD',
            status: 'active',
            createdAt: new Date()
          }
        ]
      });

      // Create account records
      await Account.create({
        accountNumber: accountNumber,
        userId: newUser._id,
        type: 'checking',
        balance: user.balance,
        currency: 'USD',
        status: 'active'
      });

      await Account.create({
        accountNumber: accountNumber2,
        userId: newUser._id,
        type: 'savings',
        balance: user.balance * 0.5,
        currency: 'USD',
        status: 'active'
      });

      // Create sample transactions
      const transactionTypes = ['deposit', 'withdrawal', 'transfer'];
      const categories = ['salary', 'shopping', 'bills', 'food', 'entertainment', 'transfer'];

      for (let j = 0; j < 10; j++) {
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const amount = Math.floor(Math.random() * 500) + 50;
        const date = new Date();
        date.setDate(date.getDate() - j);

        await Transaction.create({
          userId: newUser._id,
          accountNumber: accountNumber,
          type: type,
          amount: amount,
          balance: user.balance - (j * amount),
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${categories[Math.floor(Math.random() * categories.length)]}`,
          reference: `TXN${Date.now()}${j}`,
          status: 'completed',
          category: categories[Math.floor(Math.random() * categories.length)],
          createdAt: date
        });
      }

      createdUsers.push(newUser);
      console.log(`✓ User created: ${user.name}`);
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@bank.com / password123');
    console.log('   Staff: john.staff@bank.com / password123');
    console.log('   Staff: sarah.staff@bank.com / password123');
    console.log('   User: alice@example.com / password123');
    console.log('   User: bob@example.com / password123');
    console.log('   User: charlie@example.com / password123');
    console.log('   User: diana@example.com / password123');
    console.log('   User: edward@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

seedData();
