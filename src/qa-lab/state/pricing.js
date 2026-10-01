// Calculo de totales del checkout (puro). Todo en unidades menores (centavos) para no arrastrar
// errores de coma flotante. Orden de calculo (documentado y verificado en tests):
//   subtotal = suma(precio * cantidad)
//   descuento = round(subtotal * cupon%)
//   base imponible = subtotal - descuento          (el envio NO paga impuesto)
//   impuesto = round(base * tasa%)
//   total = base + impuesto + envio
export const SHIPPING_METHODS = ['standard', 'express', 'pickup']

export const toMinor = (n, d = 2) => Math.round(n * 10 ** d)
export const fromMinor = (m, d = 2) => m / 10 ** d

/** firstLineIgnoresQty: unico punto donde vive el bug 'total-wrong' del checkout. */
export function computeTotals({ lines, couponPct = 0, shippingCost = 0, taxRate = 0, decimals = 2, firstLineIgnoresQty = false }) {
  const subtotal = lines.reduce((s, l, i) => s + toMinor(l.price, decimals) * (firstLineIgnoresQty && i === 0 ? 1 : l.qty), 0)
  const discount = Math.round((subtotal * couponPct) / 100)
  const taxable = subtotal - discount
  const tax = Math.round((taxable * taxRate) / 100)
  const shipping = toMinor(shippingCost, decimals)
  return { subtotal, discount, taxable, tax, shipping, total: taxable + tax + shipping, decimals }
}
