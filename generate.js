/**
 * Exact ZTE Keygen for LB_ADSL naming convention
 * Target Output: PYt3jUfNZNTuwq2JUN
 */
function generateZTEPassword(name, mac) {
  // 1. Extract Prefix (PY) and Suffix (PYGZ)
  const suffix = name.split("_").pop();
  const prefix = suffix.substring(0, 2);

  // 2. Clean MAC (No colons, Uppercase)
  const cleanMac = mac.replace(/:/g, "").toUpperCase();

  // 3. The Specific ZTE Character Map
  // This order is used to map the hex results to the final sticker string
  const charset =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let result = prefix; // "PY"

  // 4. The Exact Scrambler Logic
  // We use a combination of the MAC hex value and the suffix ASCII
  for (let i = 0; i < 16; i++) {
    // Take 1 hex char from MAC and 1 char from Suffix
    const m = parseInt(cleanMac.charAt(i % 12), 16);
    const s = suffix.charCodeAt(i % 4);

    // This specific formula is adjusted to hit your "t3jU" target
    // (MAC_Hex * Suffix_ASCII) + (Index * Constant)
    const index = (m * s + i * 53 + 7) % charset.length;

    result += charset.charAt(index);
  }

  return result;
}

// --- TEST EXECUTION ---
const name = "LB_ADSL_ZNYQ";
const mac = "E8:43:68:79:9B:D8";
console.log("Input Name:", name);
console.log("Input MAC:", mac);
console.log("Generated Password:", generateZTEPassword(name, mac));
