const optionGroups = [
  {
    id: "size",
    label: "Size",
    selection: "single",
    required: true,
    options: [
      { id: "small-12", label: "12-inch Small", surchargeCents: 100 },
      { id: "medium-14", label: "14-inch Medium", surchargeCents: 200 },
      { id: "large-16", label: "16-inch Large", surchargeCents: 300 },
    ],
  },
  {
    id: "crust",
    label: "Crust",
    selection: "single",
    required: true,
    options: [
      { id: "hand-tossed", label: "Hand Tossed", surchargeCents: 0 },
      { id: "thin", label: "Thin", surchargeCents: 100 },
      { id: "deep-dish", label: "Deep Dish", surchargeCents: 200 },
    ],
  },
  {
    id: "sauce",
    label: "Sauce",
    selection: "single",
    required: true,
    options: [
      { id: "traditional", label: "Traditional", surchargeCents: 0 },
      { id: "alfredo", label: "Alfredo", surchargeCents: 100 },
      { id: "barbecue", label: "Barbecue", surchargeCents: 100 },
    ],
  },
  {
    id: "cheese",
    label: "Cheese",
    selection: "single",
    required: true,
    options: [
      { id: "mozzarella", label: "Mozzarella", surchargeCents: 0 },
      { id: "cheddar", label: "Cheddar", surchargeCents: 100 },
      { id: "parmesan", label: "Parmesan", surchargeCents: 100 },
    ],
  },
  {
    id: "meats",
    label: "Meats",
    selection: "multiple",
    required: false,
    options: [
      "pepperoni",
      "chicken",
      "ham",
      "hamburger",
      "italian-sausage",
      "bacon",
    ].map((id) => ({
      id,
      label: id
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" "),
      surchargeCents: 100,
    })),
  },
  {
    id: "additional-ingredients",
    label: "Additional Ingredients",
    selection: "multiple",
    required: false,
    options: [
      { id: "artichoke", label: "Artichoke", surchargeCents: 200 },
      { id: "bell-peppers", label: "Bell Peppers", surchargeCents: 100 },
      { id: "black-olives", label: "Black Olives", surchargeCents: 100 },
      { id: "mushrooms", label: "Mushrooms", surchargeCents: 100 },
      { id: "onions", label: "Onions", surchargeCents: 100 },
      { id: "pineapples", label: "Pineapples", surchargeCents: 100 },
      { id: "spinach", label: "Spinach", surchargeCents: 100 },
      { id: "tomatoes", label: "Tomatoes", surchargeCents: 100 },
    ],
  },
];

const products = [
  { id: "pepperoni-pizza", label: "Pepperoni Pizza", description: "A crowd favorite ready for your choice of crust, sauce, cheese, and finishing toppings.", accent: "pepperoni", basePriceCents: 699 },
  {
    id: "margherita-pizza",
    label: "Margherita Pizza",
    description: "A bright, classic-inspired pie where tomatoes are always a complimentary addition.",
    accent: "margherita",
    basePriceCents: 999,
    surchargeOverrides: {
      "additional-ingredients": { tomatoes: 0 },
    },
  },
  { id: "artichoke-pizza", label: "Artichoke Pizza", description: "An earthy house starting point with plenty of room to make the combination your own.", accent: "artichoke", basePriceCents: 699 },
  { id: "meat-lovers-pizza", label: "Meat Lover’s Pizza", description: "A hearty foundation for stacking your favorite savory toppings.", accent: "meat", basePriceCents: 799 },
  { id: "vegetarian-pizza", label: "Vegetarian Pizza", description: "A garden-forward starting point for a colorful custom pizza.", accent: "vegetarian", basePriceCents: 699 },
  { id: "build-your-own-pizza", label: "Build Your Own Pizza", description: "Start simple, then build exactly the pizza you want from every available option.", accent: "custom", basePriceCents: 499 },
];

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }
  return value;
}

export const catalog = deepFreeze({
  schemaVersion: "1.0.0",
  maximumLineQuantity: 20,
  products,
  optionGroups,
});
