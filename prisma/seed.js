import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PORT=3000
// JWT_SECRET=thisistopsecrettoken
// NODE_ENV=development

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
      password: "gccprogram",
      roleId: admin_role.id,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Eddy",
      email: "eddy@test.com",
      password: "gccprogram",
      roleId: user_role.id,
    },
  });
  for (let i = 1; i <= sampleProductsName.length; i++) {
    const baseUnit = sampleUnits[randomNumber(0, sampleUnits.length - 1)];
    const additionalUnit =
      Math.random() > 0.5
        ? sampleUnits[randomNumber(0, sampleUnits.length - 1)]
        : null;

    const vendor = sampleVendors[randomNumber(0, sampleVendors.length - 1)];

    const product = await prisma.product.create({
      data: {
        name: `${sampleProductsName[i - 1]}`,
        handle: `product-${i}`,
        description: `Description for product ${i}`,
        cost: randomNumber(50, 200),
        price: randomNumber(201, 500),
        unit: baseUnit.name,
        vendorName: vendor.name,
        vendorContact: vendor.contact,
        inventoryUnit: baseUnit.name,
        inventoryQuantity: randomNumber(50, 300),
        // units: {
        //   create: [
        //     {
        //       name: baseUnit.name,
        //       quantityInBase: baseUnit.quantityInBase,
        //       price: randomNumber(100, 300),
        //     },
        //     ...(additionalUnit
        //       ? [
        //         {
        //           name: additionalUnit.name,
        //           quantityInBase: additionalUnit.quantityInBase,
        //           price: randomNumber(20, 150),
        //         },
        //       ]
        //       : []),
        //   ],
        // },
      },
    });

    console.log(`Created: ${product.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
