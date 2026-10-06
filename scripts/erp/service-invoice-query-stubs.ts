const unavailable=async():Promise<never>=>{throw new Error('Service invoice queries are outside this fixture; use service-invoice-smoke.ts')}
export const serviceInvoiceQueryStubs={serviceInvoices:unavailable,serviceInvoice:unavailable,serviceInvoiceValidation:unavailable,serviceInvoicePdf:unavailable}
