/**
 * Curated chains with officially published nutrition data.
 * Values transcribed from each chain's published nutrition guide at build time (Sept 2026 menu items,
 * standard portions). Re-verify against the chain PDFs periodically — chains reformulate.
 * `match` is a case-insensitive regex tested against the Google Places name.
 * Expand freely: this is the highest-value table in the app for the Northgate / Texas Ave corridor.
 */
export const CHAINS = {
  chick_fil_a: {
    match: /chick-?fil-?a/i, name: 'Chick-fil-A',
    items: [
      { name: 'Chicken Sandwich', portion: '1', calories: 420, protein: 28, carbs: 41, fat: 18 },
      { name: 'Grilled Chicken Sandwich', portion: '1', calories: 390, protein: 28, carbs: 44, fat: 12 },
      { name: 'Spicy Chicken Sandwich', portion: '1', calories: 450, protein: 28, carbs: 45, fat: 19 },
      { name: 'Chick-fil-A Nuggets', portion: '8 ct', calories: 250, protein: 27, carbs: 11, fat: 11 },
      { name: 'Chick-fil-A Nuggets', portion: '12 ct', calories: 380, protein: 40, carbs: 16, fat: 17 },
      { name: 'Grilled Nuggets', portion: '8 ct', calories: 130, protein: 25, carbs: 1, fat: 3 },
      { name: 'Grilled Nuggets', portion: '12 ct', calories: 200, protein: 38, carbs: 2, fat: 4.5 },
      { name: 'Waffle Potato Fries', portion: 'Medium', calories: 420, protein: 5, carbs: 45, fat: 24 },
      { name: 'Market Salad w/ Grilled Chicken', portion: '1', calories: 550, protein: 28, carbs: 36, fat: 31 },
      { name: 'Cobb Salad w/ Grilled Chicken', portion: '1', calories: 570, protein: 39, carbs: 30, fat: 32 },
      { name: 'Grilled Cool Wrap', portion: '1', calories: 660, protein: 43, carbs: 32, fat: 40 },
      { name: 'Chicken Biscuit', portion: '1', calories: 460, protein: 19, carbs: 45, fat: 23 },
      { name: 'Egg White Grill', portion: '1', calories: 290, protein: 26, carbs: 30, fat: 8 },
      { name: 'Chick-n-Minis', portion: '4 ct', calories: 350, protein: 20, carbs: 42, fat: 12 },
    ],
  },
  chipotle: {
    match: /chipotle/i, name: 'Chipotle',
    items: [
      { name: 'Chicken', portion: '4 oz', calories: 180, protein: 32, carbs: 0, fat: 7 },
      { name: 'Steak', portion: '4 oz', calories: 150, protein: 21, carbs: 1, fat: 6 },
      { name: 'Carnitas', portion: '4 oz', calories: 210, protein: 23, carbs: 0, fat: 12 },
      { name: 'Barbacoa', portion: '4 oz', calories: 170, protein: 24, carbs: 2, fat: 7 },
      { name: 'Sofritas', portion: '4 oz', calories: 150, protein: 8, carbs: 9, fat: 10 },
      { name: 'White Rice', portion: '4 oz', calories: 210, protein: 4, carbs: 40, fat: 4 },
      { name: 'Brown Rice', portion: '4 oz', calories: 210, protein: 4, carbs: 36, fat: 6 },
      { name: 'Black Beans', portion: '4 oz', calories: 130, protein: 8, carbs: 22, fat: 1.5 },
      { name: 'Pinto Beans', portion: '4 oz', calories: 130, protein: 8, carbs: 21, fat: 1.5 },
      { name: 'Fajita Veggies', portion: '2 oz', calories: 20, protein: 1, carbs: 5, fat: 0 },
      { name: 'Cheese', portion: '1 oz', calories: 110, protein: 6, carbs: 1, fat: 8 },
      { name: 'Sour Cream', portion: '2 oz', calories: 110, protein: 2, carbs: 2, fat: 9 },
      { name: 'Guacamole', portion: '4 oz', calories: 230, protein: 2, carbs: 8, fat: 22 },
      { name: 'Fresh Tomato Salsa', portion: '4 oz', calories: 25, protein: 0, carbs: 4, fat: 0 },
      { name: 'Flour Tortilla (burrito)', portion: '1', calories: 320, protein: 8, carbs: 50, fat: 9 },
      { name: 'Chips', portion: '4 oz', calories: 540, protein: 7, carbs: 73, fat: 25 },
    ],
  },
  raising_canes: {
    match: /raising\s*cane/i, name: "Raising Cane's",
    items: [
      { name: 'Chicken Finger', portion: '1', calories: 130, protein: 14, carbs: 8, fat: 5 },
      { name: 'Crinkle-Cut Fries', portion: '1 serving', calories: 390, protein: 5, carbs: 50, fat: 19 },
      { name: 'Texas Toast', portion: '1 slice', calories: 150, protein: 4, carbs: 20, fat: 6 },
      { name: 'Coleslaw', portion: '1 serving', calories: 200, protein: 1, carbs: 15, fat: 15 },
      { name: "Cane's Sauce", portion: '1 cup', calories: 190, protein: 0, carbs: 5, fat: 19 },
    ],
  },
  panda_express: {
    match: /panda\s*express/i, name: 'Panda Express',
    items: [
      { name: 'Orange Chicken', portion: '5.7 oz', calories: 490, protein: 25, carbs: 51, fat: 23 },
      { name: 'Grilled Teriyaki Chicken', portion: '6 oz', calories: 275, protein: 33, carbs: 14, fat: 10 },
      { name: 'String Bean Chicken Breast', portion: '5.6 oz', calories: 190, protein: 14, carbs: 13, fat: 9 },
      { name: 'Broccoli Beef', portion: '5.4 oz', calories: 150, protein: 9, carbs: 13, fat: 7 },
      { name: 'Beijing Beef', portion: '5.6 oz', calories: 480, protein: 14, carbs: 46, fat: 27 },
      { name: 'White Steamed Rice', portion: '8.1 oz', calories: 380, protein: 7, carbs: 87, fat: 0 },
      { name: 'Fried Rice', portion: '9.3 oz', calories: 520, protein: 11, carbs: 85, fat: 16 },
      { name: 'Chow Mein', portion: '9.4 oz', calories: 510, protein: 13, carbs: 80, fat: 20 },
      { name: 'Super Greens', portion: '5.9 oz', calories: 90, protein: 6, carbs: 10, fat: 3 },
    ],
  },
  subway: {
    match: /subway/i, name: 'Subway',
    items: [
      { name: 'Rotisserie-Style Chicken 6"', portion: '6 in', calories: 350, protein: 26, carbs: 41, fat: 8 },
      { name: 'Turkey Breast 6"', portion: '6 in', calories: 270, protein: 18, carbs: 41, fat: 4 },
      { name: 'Oven Roasted Turkey Footlong', portion: '12 in', calories: 540, protein: 36, carbs: 82, fat: 8 },
      { name: 'Steak & Cheese 6"', portion: '6 in', calories: 380, protein: 26, carbs: 42, fat: 11 },
      { name: 'Veggie Delite 6"', portion: '6 in', calories: 200, protein: 8, carbs: 39, fat: 2 },
      { name: 'Tuna 6"', portion: '6 in', calories: 460, protein: 20, carbs: 40, fat: 24 },
    ],
  },
  panera: {
    match: /panera/i, name: 'Panera',
    items: [
      { name: 'Turkey Sandwich (whole)', portion: '1', calories: 590, protein: 33, carbs: 74, fat: 17 },
      { name: 'Chipotle Chicken Avocado Melt (whole)', portion: '1', calories: 800, protein: 48, carbs: 66, fat: 36 },
      { name: 'Greek Salad w/ Chicken', portion: '1', calories: 530, protein: 31, carbs: 16, fat: 40 },
      { name: 'Broccoli Cheddar Soup', portion: 'Bowl', calories: 360, protein: 14, carbs: 22, fat: 24 },
      { name: 'Ten Vegetable Soup', portion: 'Bowl', calories: 100, protein: 4, carbs: 16, fat: 2 },
      { name: 'Mediterranean Bowl w/ Chicken', portion: '1', calories: 590, protein: 35, carbs: 68, fat: 22 },
    ],
  },
  whataburger: {
    match: /whataburger/i, name: 'Whataburger',
    items: [
      { name: 'Whataburger', portion: '1', calories: 590, protein: 27, carbs: 62, fat: 25 },
      { name: 'Whataburger Jr.', portion: '1', calories: 310, protein: 14, carbs: 33, fat: 13 },
      { name: 'Grilled Chicken Sandwich', portion: '1', calories: 410, protein: 30, carbs: 48, fat: 11 },
      { name: "Whatachick'n Sandwich", portion: '1', calories: 560, protein: 27, carbs: 58, fat: 25 },
      { name: 'French Fries', portion: 'Medium', calories: 380, protein: 5, carbs: 53, fat: 17 },
      { name: 'Breakfast on a Bun (Bacon)', portion: '1', calories: 380, protein: 16, carbs: 33, fat: 20 },
      { name: 'Taquito w/ Cheese (Bacon)', portion: '1', calories: 380, protein: 15, carbs: 30, fat: 22 },
    ],
  },
};

export function matchChain(placeName) {
  for (const [key, c] of Object.entries(CHAINS)) if (c.match.test(placeName)) return { key, ...c };
  return null;
}

// ---- Added for the UTD / Richardson corridor (Campbell Rd, Coit Rd, Northside). Same caveat: verify against chain PDFs. ----
Object.assign(CHAINS, {
  in_n_out: {
    match: /in-?n-?out/i, name: 'In-N-Out',
    items: [
      { name: 'Hamburger', portion: '1', calories: 390, protein: 16, carbs: 39, fat: 19 },
      { name: 'Cheeseburger', portion: '1', calories: 480, protein: 22, carbs: 39, fat: 27 },
      { name: 'Double-Double', portion: '1', calories: 670, protein: 37, carbs: 39, fat: 41 },
      { name: 'Protein Style Double-Double', portion: '1', calories: 520, protein: 33, carbs: 11, fat: 39 },
      { name: 'French Fries', portion: '1', calories: 370, protein: 6, carbs: 49, fat: 15 },
    ],
  },
  wingstop: {
    match: /wingstop/i, name: 'Wingstop',
    items: [
      { name: 'Boneless Wings', portion: '10 pc', calories: 800, protein: 50, carbs: 70, fat: 35 },
      { name: 'Classic Wings (plain)', portion: '10 pc', calories: 900, protein: 80, carbs: 0, fat: 60 },
      { name: 'Crispy Tenders', portion: '3 pc', calories: 460, protein: 32, carbs: 38, fat: 20 },
      { name: 'Seasoned Fries', portion: 'Regular', calories: 430, protein: 5, carbs: 55, fat: 21 },
    ],
  },
  jersey_mikes: {
    match: /jersey mike/i, name: "Jersey Mike's",
    items: [
      { name: '#7 Turkey & Provolone (regular)', portion: 'Regular', calories: 570, protein: 39, carbs: 63, fat: 17 },
      { name: '#13 Original Italian (regular)', portion: 'Regular', calories: 880, protein: 42, carbs: 64, fat: 50 },
      { name: '#17 Mike\'s Famous Philly (regular)', portion: 'Regular', calories: 780, protein: 49, carbs: 65, fat: 34 },
      { name: '#7 Turkey & Provolone Sub in a Tub', portion: 'Regular', calories: 240, protein: 32, carbs: 6, fat: 10 },
    ],
  },
  cava: {
    match: /\bcava\b/i, name: 'CAVA',
    items: [
      { name: 'Grilled Chicken', portion: '1 scoop', calories: 250, protein: 33, carbs: 5, fat: 11 },
      { name: 'Grilled Steak', portion: '1 scoop', calories: 210, protein: 26, carbs: 2, fat: 11 },
      { name: 'Falafel', portion: '1 scoop', calories: 250, protein: 8, carbs: 24, fat: 14 },
      { name: 'Saffron Basmati Rice', portion: '1 base', calories: 250, protein: 5, carbs: 49, fat: 3 },
      { name: 'SuperGreens', portion: '1 base', calories: 20, protein: 2, carbs: 4, fat: 0 },
      { name: 'Traditional Hummus', portion: '1 dip', calories: 60, protein: 2, carbs: 4, fat: 4 },
      { name: 'Tzatziki', portion: '1 dip', calories: 25, protein: 1, carbs: 2, fat: 2 },
      { name: 'Pita', portion: '1', calories: 200, protein: 7, carbs: 41, fat: 1 },
    ],
  },
  jimmy_johns: {
    match: /jimmy john/i, name: "Jimmy John's",
    items: [
      { name: '#4 Turkey Tom (8")', portion: '8 in', calories: 540, protein: 31, carbs: 70, fat: 16 },
      { name: '#4 Turkey Tom Unwich', portion: 'Lettuce wrap', calories: 200, protein: 22, carbs: 5, fat: 10 },
      { name: '#10 Hunter\'s Club (8")', portion: '8 in', calories: 780, protein: 47, carbs: 71, fat: 32 },
      { name: '#6 The Veggie (8")', portion: '8 in', calories: 700, protein: 28, carbs: 73, fat: 34 },
    ],
  },
});
