import bcrypt from 'bcryptjs'
const h = await bcrypt.hash('Admin123', 12)
console.log('HASH:', h)
const match = await bcrypt.compare('Admin123', h)
console.log('Match:', match)