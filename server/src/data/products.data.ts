export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  occasions: string[];
  fabric: string;
  colours: string[];
  fits: string[];
  price: number;
  imageUrl: string | null;
  productUrl: string;
  inStock: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Navy Blue Linen Wedding Suit",
    slug: "navy-blue-linen-wedding-suit",
    category: "suit",
    occasions: ["wedding", "party"],
    fabric: "linen",
    colours: ["navy blue", "blue"],
    fits: ["slim", "regular", "tailored"],
    price: 18999,
    imageUrl: null,
    productUrl: "/products/navy-blue-linen-wedding-suit",
    inStock: true,
  },
  {
    id: 2,
    name: "Classic Navy Wool Business Suit",
    slug: "classic-navy-wool-business-suit",
    category: "suit",
    occasions: ["business", "interview"],
    fabric: "wool",
    colours: ["navy blue"],
    fits: ["slim", "regular"],
    price: 19999,
    imageUrl: null,
    productUrl: "/products/classic-navy-wool-business-suit",
    inStock: true,
  },
  {
    id: 3,
    name: "Beige Linen Summer Suit",
    slug: "beige-linen-summer-suit",
    category: "suit",
    occasions: ["wedding", "party", "travel"],
    fabric: "linen",
    colours: ["beige", "cream"],
    fits: ["regular", "relaxed", "tailored"],
    price: 17999,
    imageUrl: null,
    productUrl: "/products/beige-linen-summer-suit",
    inStock: true,
  },
  {
    id: 4,
    name: "Black Wool Tuxedo",
    slug: "black-wool-tuxedo",
    category: "tuxedo",
    occasions: ["wedding", "party"],
    fabric: "wool",
    colours: ["black"],
    fits: ["slim", "regular", "tailored"],
    price: 24999,
    imageUrl: null,
    productUrl: "/products/black-wool-tuxedo",
    inStock: true,
  },
  {
    id: 5,
    name: "Burgundy Wedding Sherwani",
    slug: "burgundy-wedding-sherwani",
    category: "sherwani",
    occasions: ["wedding", "festival"],
    fabric: "silk",
    colours: ["burgundy", "red"],
    fits: ["regular", "tailored"],
    price: 22999,
    imageUrl: null,
    productUrl: "/products/burgundy-wedding-sherwani",
    inStock: true,
  },
  {
    id: 6,
    name: "White Premium Cotton Shirt",
    slug: "white-premium-cotton-shirt",
    category: "shirt",
    occasions: ["business", "interview", "casual"],
    fabric: "cotton",
    colours: ["white"],
    fits: ["slim", "regular", "relaxed"],
    price: 3999,
    imageUrl: null,
    productUrl: "/products/white-premium-cotton-shirt",
    inStock: true,
  },
  {
    id: 7,
    name: "Blue Linen Casual Shirt",
    slug: "blue-linen-casual-shirt",
    category: "shirt",
    occasions: ["casual", "travel"],
    fabric: "linen",
    colours: ["blue", "light blue"],
    fits: ["slim", "regular", "relaxed"],
    price: 4499,
    imageUrl: null,
    productUrl: "/products/blue-linen-casual-shirt",
    inStock: true,
  },
  {
    id: 8,
    name: "Navy Silk Tie",
    slug: "navy-silk-tie",
    category: "accessories",
    occasions: ["wedding", "business", "party"],
    fabric: "silk",
    colours: ["navy blue"],
    fits: [],
    price: 1499,
    imageUrl: null,
    productUrl: "/products/navy-silk-tie",
    inStock: true,
  },
];