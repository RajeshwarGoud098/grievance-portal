
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Department = require('./models/Department');

const departments = [
  { name: 'Public Works', description: 'Roads, bridges, infrastructure', icon: '🏗️' },
  { name: 'Water & Sanitation', description: 'Water supply and sewage', icon: '💧' },
  { name: 'Electricity', description: 'Power supply and outages', icon: '⚡' },
  { name: 'Health Services', description: 'Hospitals and medical care', icon: '🏥' },
  { name: 'Education', description: 'Schools and educational institutions', icon: '📚' },
  { name: 'Transport', description: 'Public transport and traffic', icon: '🚌' },
  { name: 'Environment', description: 'Garbage, pollution, parks', icon: '🌿' },
  { name: 'Revenue & Tax', description: 'Property tax and revenue', icon: '💼' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Department.deleteMany({});
  await User.deleteMany({ role: { $in: ['admin', 'manager'] } });

  // Create departments
  const createdDepts = await Department.insertMany(departments);
  console.log(`✅ Created ${createdDepts.length} departments`);

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@grievance.com',
    password: 'admin123',
    role: 'admin',
  });
  console.log(`✅ Admin created: admin@grievance.com / admin123`);

  // Create one manager per department
  for (let i = 0; i < createdDepts.length; i++) {
    const dept = createdDepts[i];
    const managerEmail = `manager.${dept.name.toLowerCase().replace(/\s+&?\s*/g, '.')}@grievance.com`;
    const manager = await User.create({
      name: `${dept.name} Manager`,
      email: managerEmail,
      password: 'manager123',
      role: 'manager',
      department: dept._id,
    });
    await Department.findByIdAndUpdate(dept._id, { manager: manager._id });
    console.log(`✅ Manager: ${managerEmail} / manager123`);
  }

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
