import { PrismaClient } from "@prisma/client";
import { products } from "./productSeed.js";

const prisma = new PrismaClient();

const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sampleUnits = [
  { name: "packet", quantityInBase: 25 },
  { name: "kg", quantityInBase: 1 },
  { name: "sachet", quantityInBase: 5 },
  { name: "piece", quantityInBase: 1 },
];

const sampleProductsName = [
  "Dalle Armstrong",
  "Plaque ba13 std 1200 * 2800 mm knauf",
  "Rockmar kraft 7,8m² 5cm",
  "Tige filtée 6mm (1000mm)",
  "Enduit pour joint 25kg",
  "Entretoire 1200mm",
  "Entretoire 600mm",
  "Porteur 3700mm",
  "Plaque ba13 hydrofuge 1200 * 2800 mm ",
  "Bande armée 30m",
  "Trappe de visite 400 * 400",
  "Bande a joint 150m ",
  "Vis 3,5 * 25 mm",
  "Cheville à frapper ",
  "Fourrure 3ml",
  "Cheville laiton",
  "Vis TTPC 45mm",
  "Porteur 3700mm malaga",
  "Entretoire 1200mm ventatec",
  "Entretoire 600mm ventatec",
  "Ecrous 6m",
  "Coulisseau",
  "Cournière Blanc",
  "Cournière galvanisée",
  "Clip ipn",
  "Satencement Gray",
];
const sampleVendors = [
  { name: "Vendor A", contact: "0612345678" },
  { name: "Vendor B", contact: "0623456789" },
  { name: "Vendor C", contact: "0634567890" },
];
const genRanHex = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
async function main() {
  const admin_role = await prisma.role.create({
    data: {
      jobTitle: "admin",
      description: "do everything",
    },
  });
  const user_role = await prisma.role.create({
    data: {
      jobTitle: "user",
      description: "strict to permission",
    },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Youssef",
      email: "youssef@test.com",
      password: "....",
      roleId: admin_role.id,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Eddy",
      email: "eddy@test.com",
      password: "....",
      roleId: user_role.id,
    },
  });

  await Promise.all(
    products.map(async (product) => {
      const p = await prisma.product.create({
        data: {
          name: product.name,
          handle: genRanHex(16),
          image: product.image,
          description: product.description,
          cost: product.cost,
          price: product.price,
          unit: product.unit,
          vendorName: product.vendorName,
          vendorContact: product.vendorContact,
        },
      });
      console.log(`✅ Created: ${p.name}`);
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
