import { database } from "../model/database.js";

export async function getBestSellingProduct(opts) {
  let result;
  try {
    result = await database.productStats.findFirst({
      where: {
        period: opts.period,
        key: opts.key,
      },
      orderBy: {
        saleNumber: "desc",
      },
      include: {
        product: true,
      },
    });
  } catch (err) {
    console.log("error fetching best selling product", err);
  }
  return result;
}

export async function getSellingProducts(opts) {
  try {
    const records = await database.productStats.groupBy({
      by: ["key"],
      where: {
        period: opts.period,
      },
      _count: {
        key: true,
      },
      // orderBy: {
      //   _count: {
      //     key: 'desc',
      //   },
      // },
    });

    const formattedRecords = records.map((record) => ({
      key: record.key,
      soldProducts: record._count.key,
    }));

    return formattedRecords;
  } catch (err) {
    console.log("error fetching selling products : ", err);
    return [];
  }
}
