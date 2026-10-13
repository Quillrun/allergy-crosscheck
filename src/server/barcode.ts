// One barcode rule for the scan page and the check_product tool: a misread digit must not look up another product.

export const checkOk = (code: string) => {
  const d = [...code].map(Number);
  const sum = d.slice(0, -1).reverse().reduce((n, x, i) => n + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === d[d.length - 1];
};

/** A UPC-E code (8 digits, number system 0 or 1) as the 12-digit UPC-A it stands for. */
export function expandUpcE(code: string): string {
  const [ns, a, b, c, d, e, f, check] = code;
  const body = "012".includes(f) ? `${a}${b}${f}0000${c}${d}${e}` : f === "3" ? `${a}${b}${c}00000${d}${e}` : f === "4" ? `${a}${b}${c}${d}00000${e}` : `${a}${b}${c}${d}${e}0000${f}`;
  return `${ns}${body}${check}`;
}

/** The barcode to look up, or undefined when it isn't valid: a GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) with a valid check digit, or a UPC-E, which is expanded to UPC-A (Open Food Facts keys products by that). */
export function normalizeBarcode(code: string): string | undefined {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return undefined;
  if (checkOk(code)) return code;
  if (code.length === 8 && /^[01]/.test(code)) {
    const upcA = expandUpcE(code);
    if (checkOk(upcA)) return upcA;
  }
  return undefined;
}

export const validBarcode = (code: string): boolean => normalizeBarcode(code) !== undefined;
