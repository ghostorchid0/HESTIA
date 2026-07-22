const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Settings = require('./models/Settings');

async function seedData() {
  try {
    let defaultHotel = await Hotel.findOne({ slug: 'default' });
    if (!defaultHotel) {
      defaultHotel = await Hotel.create({
        name: 'Hestia',
        slug: 'default',
        currency: '$',
        active: true,
      });
      console.log('Seeded default hotel');
    }

    if ((await Room.countDocuments()) === 0) {
      await Room.insertMany([
        { hotelId: defaultHotel._id, uuid: uuidv4(), number: '101', active: true },
        { hotelId: defaultHotel._id, uuid: uuidv4(), number: '102', active: true },
        { hotelId: defaultHotel._id, uuid: uuidv4(), number: '103', active: true },
      ]);
      console.log('Seeded rooms');
    }

    if ((await MenuItem.countDocuments()) === 0) {
      await MenuItem.insertMany([
        { hotelId: defaultHotel._id, name: 'Continental Breakfast', description: 'Pastries, juice, coffee', price: 18, category: 'Breakfast', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Eggs Benedict', description: 'Poached eggs with hollandaise', price: 22, category: 'Breakfast', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 16, category: 'Main Courses', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Grilled Salmon', description: 'With seasonal vegetables', price: 32, category: 'Main Courses', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Burger & Fries', description: 'Beef burger with house fries', price: 24, category: 'Main Courses', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Cocktail', description: 'Chef choice cocktail', price: 14, category: 'Drinks', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Sparkling Water', description: '500 ml', price: 5, category: 'Drinks', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Dental Kit', description: 'Toothbrush and toothpaste', price: 4, category: 'Amenities', available: true, imageUrl: '' },
        { hotelId: defaultHotel._id, name: 'Extra Towels', description: 'Set of 2 bath towels', price: 0, category: 'Amenities', available: true, imageUrl: '' },
      ]);
      console.log('Seeded menu items');
    }

    if ((await User.countDocuments()) === 0) {
      await User.create({
        hotelId: defaultHotel._id,
        username: config.adminUsername,
        password: config.adminPassword,
        role: 'admin',
      });
      console.log('Seeded admin user');
    }

    if ((await Settings.countDocuments()) === 0) {
      await Settings.create({ hotelId: defaultHotel._id, hotelName: 'Hestia' });
      console.log('Seeded settings');
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

module.exports = seedData;
