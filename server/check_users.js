const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showUsers() {
    const users = await prisma.user.findMany();
    console.log("--- USERS IN DATABASE ---");
    console.log(users);
}

showUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
