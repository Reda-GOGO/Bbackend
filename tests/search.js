// import { readFileSync } from "fs";
//
// function search(name, collection) {
//   // Read and parse the JSON file
//   const data = JSON.parse(readFileSync("./tests/data.json", "utf8"));
//
//   // Extract the products (ensure products exist)
//   const products = [...data.products];
//
//   // Create a dynamic pattern based on the name you are searching for
//   const pattern = new RegExp(name, 'i'); // Case-insensitive search
//
//   // This will hold the results, sorted by relevance
//   let exactMatches = [];
//   let partialMatches = [];
//
//   // Loop through each product and check if the name matches
//   for (const product of products) {
//     const match = product.name.match(pattern);
//
//     if (match) {
//       // Prioritize products that start with the search term or have it early
//       if (product.name.toLowerCase().startsWith(name.toLowerCase())) {
//         exactMatches.push(product); // Exact match goes here
//       } else {
//         partialMatches.push(product); // Partial match goes here
//       }
//     }
//   }
//
//   // Output the results: first exact matches, then partial matches
//   console.log("Exact Matches:");
//   exactMatches.forEach((product) => console.log(product.name));
//
//   console.log("\nPartial Matches:");
//   partialMatches.forEach((product) => console.log(product.name));
// }
//
// // Call the search function with the desired name
// search("Vis");
//
























import { readFileSync } from "fs";

function search(name, collectionName) {
  // Extract the products (ensure products exist)
  const data = JSON.parse(readFileSync("./tests/data.json", "utf8"));
  const products = [...data.products];

  // Create dynamic patterns based on the name and collection name
  const namePattern = new RegExp(name ? name : "", 'i');         // Case-insensitive search for name
  const collectionPattern = new RegExp(collectionName, 'i'); // Case-insensitive search for collection name

  // This will hold the results, sorted by relevance
  let exactMatches = [];
  let partialMatches = [];

  // Loop through each product and check if the name and collection name match
  for (const product of products) {
    let nameMatch = product.name.match(namePattern);
    let collectionMatch;
    if (product.Collection) {
      collectionMatch = product.Collection.name.match(collectionPattern);
    }

    // Check if both the name and collection match
    if (nameMatch || collectionMatch) {
      // Prioritize products that have both exact matches for name and collection
      if (
        product.name.toLowerCase().startsWith(name.toLowerCase()) &&
        product.Collection.name.toLowerCase().startsWith(collectionName.toLowerCase())
      ) {
        exactMatches.push(product); // Exact match goes here
      } else {
        partialMatches.push(product); // Partial match goes here
      }
    }
  }

  // Output the results: first exact matches, then partial matches
  console.log("Exact Matches:");
  exactMatches.forEach((product) => console.log(`${product.name} - ${product.Collection.name}`));

  console.log("\nPartial Matches:");
  partialMatches.forEach((product) => console.log(`${product.name} - ${product.Collection.name}`));
}

search("b", "bande");
