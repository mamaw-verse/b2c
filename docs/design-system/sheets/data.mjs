// Sample content for sheets and reference screens. Neutral, PH-market, halal-first, no real brands.
// halal: 'certified' (certificate verified by the platform) | 'na' (non-food, Muslim-friendly; no certificate required).
// Certifier names are sample data only: verify against the NCMF's current accredited list before launch (see docs/halal.md).
export const BRAND = { name: process.env.BRAND_NAME || 'Amanah' };

export const products = [
  { name: 'Ajwa dates 500g, premium grade, resealable tub', price: 649, was: 799, rating: 4.9, sold: 12400, loc: 'Taguig', verified: true, ic: 'cookie', free: true, halal: 'certified', body: 'IDCP' },
  { name: 'Halal-certified chicken longganisa, frozen 500g', price: 235, rating: 4.8, sold: 6200, loc: 'Davao City', ic: 'beef', halal: 'certified', body: 'HDIP', frozen: true },
  { name: 'Instant chiffon hijab, 12 colours, no pins needed', price: 249, was: 329, rating: 4.9, sold: 25300, loc: 'Manila', verified: true, ic: 'shirt', halal: 'na' },
  { name: 'Handwoven Maranao malong, hand-stitched tapestry', price: 1850, rating: 4.8, sold: 860, loc: 'Marawi City', ic: 'shopping-bag', free: true, halal: 'na' },
  { name: 'Halal-certified beef tapa 300g, vacuum pack', price: 289, was: 345, rating: 4.7, sold: 3200, loc: 'Zamboanga City', verified: true, ic: 'beef', halal: 'certified', body: 'MinHA', frozen: true },
  { name: 'Travel prayer mat with qibla compass and pouch', price: 349, was: 599, rating: 4.7, sold: 5100, loc: 'Quezon City', ic: 'moon-star', halal: 'na' },
  { name: 'Alcohol-free rosewater toner 100ml', price: 395, rating: 4.6, sold: 1100, loc: 'Cagayan de Oro', ic: 'droplets', free: true, halal: 'certified', body: 'MinHA' },
  { name: 'Qur’an with English translation, hardcover', price: 780, rating: 4.9, sold: 410, loc: 'Cotabato City', ic: 'book-open', halal: 'na' },
];
export const shops = [
  { name: 'Barakah Pantry', loc: 'Cotabato City', rating: 4.9, followers: 12800, products: 86, chat: '97%', verified: true, halal: true },
  { name: 'Mindanao Halal Meats', loc: 'Davao City', rating: 4.8, followers: 3400, products: 142, chat: '92%' },
];
export const categories = [['Halal Food', 'utensils'], ['Meat & Seafood', 'beef'], ['Dates & Sweets', 'candy'], ['Modest Fashion', 'shirt'], ['Prayer Essentials', 'moon-star'], ['Books & Quran', 'book-open'], ['Health & Beauty', 'droplets'], ['Baby & Kids', 'smile'], ['Home & Living', 'house'], ['Vouchers', 'ticket']];
