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
      const menuItems = [
        { name: 'Continental Breakfast', description: 'Pastries, juice, coffee', price: 18, category: 'Breakfast', available: true, imageUrl: '' },
        { name: 'Eggs Benedict', description: 'Poached eggs with hollandaise', price: 22, category: 'Breakfast', available: true, imageUrl: '' },
        { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 16, category: 'Main Courses', available: true, imageUrl: '' },
        { name: 'Grilled Salmon', description: 'With seasonal vegetables', price: 32, category: 'Main Courses', available: true, imageUrl: '' },
        { name: 'Burger & Fries', description: 'Beef burger with house fries', price: 24, category: 'Main Courses', available: true, imageUrl: '' },
        { name: 'Cocktail', description: 'Chef choice cocktail', price: 14, category: 'Drinks', available: true, imageUrl: '' },
        { name: 'Sparkling Water', description: '500 ml', price: 5, category: 'Drinks', available: true, imageUrl: '' },
        { name: 'Dental Kit', description: 'Toothbrush and toothpaste', price: 4, category: 'Amenities', available: true, imageUrl: '' },
        { name: 'Extra Towels', description: 'Set of 2 bath towels', price: 0, category: 'Amenities', available: true, imageUrl: '' },
      ];
      await MenuItem.insertMany(menuItems.map(i => ({ ...i, hotelId: defaultHotel._id })));
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

    let superadmin = await User.findOne({ username: config.superadminUsername });
    if (!superadmin) {
      await User.create({
        username: config.superadminUsername,
        password: config.superadminPassword,
        role: 'superadmin',
      });
      console.log('Seeded superadmin user');
    }

    if ((await Settings.countDocuments()) === 0) {
      await Settings.create({ hotelId: defaultHotel._id, hotelName: 'Hestia' });
      console.log('Seeded settings');
    }

    // Demo hotel for sales page
    let demoHotel = await Hotel.findOne({ slug: 'demo' });
    if (!demoHotel) {
      demoHotel = await Hotel.create({
        name: 'Hestia Demo Hotel',
        slug: 'demo',
        currency: 'XOF',
        contactPhone: '+228 90 00 00 00',
        active: true,
      });
      console.log('Seeded demo hotel');
    }

    const demoRoomsExist = await Room.countDocuments({ hotelId: demoHotel._id });
    if (demoRoomsExist === 0) {
      await Room.insertMany([
        { hotelId: demoHotel._id, uuid: uuidv4(), number: 'D101', active: true },
        { hotelId: demoHotel._id, uuid: uuidv4(), number: 'D102', active: true },
      ]);
      console.log('Seeded demo rooms');
    }

    const demoMenuExist = await MenuItem.countDocuments({ hotelId: demoHotel._id });
    if (demoMenuExist === 0) {
      const demoMenu = [
        { name: 'Petit-déjeuner continental', description: 'Viennoiseries, jus, café', price: 3500, category: 'Petit-déjeuner', available: true, imageUrl: '' },
        { name: 'Omelette aux fines herbes', description: 'Oeufs, fromage, herbes', price: 2500, category: 'Petit-déjeuner', available: true, imageUrl: '' },
        { name: 'Poulet rôti', description: 'Avec légumes de saison', price: 6500, category: 'Plats', available: true, imageUrl: '' },
        { name: 'Burger maison', description: 'Boeuf, frites maison', price: 4500, category: 'Plats', available: true, imageUrl: '' },
        { name: 'Jus de bissap', description: '50 cl', price: 1200, category: 'Boissons', available: true, imageUrl: '' },
        { name: 'Eau minérale', description: '50 cl', price: 800, category: 'Boissons', available: true, imageUrl: '' },
      ];
      await MenuItem.insertMany(demoMenu.map(i => ({ ...i, hotelId: demoHotel._id })));
      console.log('Seeded demo menu');
    }

    const demoSettings = await Settings.findOne({ hotelId: demoHotel._id });
    if (!demoSettings) {
      await Settings.create({ hotelId: demoHotel._id, hotelName: 'Hestia Demo Hotel', currency: 'XOF' });
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

module.exports = seedData;
