const categories = [
  {
    category: "Fashion",
    image:
      `${process.env.BASE_URL}/neargud/constants/categoriesImages/fashion.jpg`,
    subcategories: {
      category: [
        {
          name: "Men's",
          image:
          `${process.env.BASE_URL}/neargud/constants/categoriesImages/men's.jpg`,
        },
        {
          name: "Women's",
          image:
          `${process.env.BASE_URL}/neargud/constants/categoriesImages/women's.jpg`,
        },
        { name: "Kids", image: null },
        { name: "Tailor", image: null },
        { name: "Boutique", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Shoes",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/shoes.jpg`,
    subcategories: {
      category: [
        { name: "Men's", image: null },
        { name: "Women's", image: null },
        { name: "Kids", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Printing & Flex, Banner",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/printing&flex.jpg`,
    subcategories: null,
  },
  {
    category: "Hotel & Restaurants",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/hotels.jpg`,
    subcategories: {
      category: [
        { name: "Cafe", image: null },
        {
          name: "Restaurants",
          image:
          `${process.env.BASE_URL}/neargud/constants/categoriesImages/restaurants.jpg`,
        },
        { name: "Pub", image: null },
        { name: "Hotel Stay", image: null },
        { name: "Banquet Hall", image: null },
        { name: "Party Hall", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Mobiles & Accessories",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/mobiles&accessories.jpg`,
    subcategories: {
      category: [
        { name: "Mobiles", image: null },
        { name: "Accessories", image: null },
        { name: "Tablets", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Beauty Shops & Cosmetics",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/beautyShops&cosmetics.jpg`,
    subcategories: null,
  },
  {
    category: "Real Estate",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/realEstate.jpg`,
    subcategories: {
      category: [{ name: "Just Like OLX & Construction", image: null }],
      subcategory: null,
    },
  },
  {
    category: "Electronic & Appliances",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Electronic&Appliances.jpg`,
    subcategories: {
      category: [{ name: "Just Like OLX", image: null }],
      subcategory: null,
    },
  },
  {
    category: "Bags",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Bags.jpg`,
    subcategories: null,
  },
  {
    category: "Saloon & Spa",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Saloon & Spa.jpg`,
    subcategories: null,
  },
  {
    category: "Jewelleries",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/jewelleries.jpg`,
    subcategories: null,
  },
  {
    category: "Gyms / Yoga",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Gyms&Yoga.jpg`,
    subcategories: null,
  },
  {
    category: "Lights",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Lights.jpg`,
    subcategories: null,
  },
  {
    category: "Interior Design",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/interiorDesign.jpg`,
    subcategories: {
      category: [
        { name: "Home Interior", image: null },
        { name: "Modular Kitchen", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Event Management",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/EventManagement.jpg`,
    subcategories: null,
  },
  {
    category: "Sanitary / Hardware",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Sanitary&Hardware.jpg`,
    subcategories: null,
  },
  {
    category: "Tiles & Marbles",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Tiles&Marbles.jpg`,
    subcategories: null,
  },
  {
    category: "Tours & Travels",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Tours&Travels.jpg`,
    subcategories: null,
  },
  {
    category: "Vehicles",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Vehicles.jpg`,
    subcategories: {
      category: [
        { name: "New", image: null },
        { name: "Old", image: null },
      ],
      subcategory: {
        New: [
          {
            name: "Car",
            image:
            `${process.env.BASE_URL}/neargud/constants/categoriesImages/cars.jpg`,
          },
          {
            name: "Bike",
            image:
               `${process.env.BASE_URL}/neargud/constants/categoriesImages/bikes.jpg`,
          },
          { name: "Commercial Vehicle", image: null },
        ],
        Old: [
          {
            name: "Car",
            image:
            `${process.env.BASE_URL}/neargud/constants/categoriesImages/cars.jpg`,
          },
          {
            name: "Bike",
            image:
            `${process.env.BASE_URL}/neargud/constants/categoriesImages/bikes.jpg`,
          },
          { name: "Commercial Vehicle", image: null },
        ],
      },
    },
  },
  {
    category: "Healthcare",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Healthcare.jpg,`,
    subcategories: {
      category: [
        { name: "Eye", image: null },
        { name: "Skin", image: null },
        { name: "Dental", image: null },
        { name: "IVF", image: null },
        { name: "Patholab", image: null },
        { name: "Multispeciality", image: null },
        { name: "Medical", image: null },
        { name: "Blood Bank", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Education",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Education.jpg`,
    subcategories: {
      category: [
        { name: "Coaching", image: null },
        { name: "College & University", image: null },
        { name: "School", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Catering Service",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/CateringService.jpg`,
    subcategories: null,
  },
  {
    category: "Bakery & Cake",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Bakery&Cake.jpg`,
    subcategories: null,
  },
  {
    category: "Home Decor",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/HomeDecor.jpg`,
    subcategories: null,
  },
  {
    category: "Influencer",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Influencer.jpg`,
    subcategories: null,
  },
  {
    category: "Furniture",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Furniture.jpg`,
    subcategories: null,
  },
  {
    category: "Car Accessories",
    image: null,
    subcategories: null,
  },
  {
    category: "Gift Shop",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/GiftShop.jpg`,
    subcategories: null,
  },
  {
    category: "Laundry & Dry Cleaners",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Laundry&DryCleaners.jpg`,
    subcategories: null,
  },
  {
    category: "Library",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Library.jpg`,
    subcategories: null,
  },
  {
    category: "Car Wash",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Car Wash.jpg`,
    subcategories: null,
  },
  {
    category: "Pet & Feeds",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Pet&Feeds.jpg`,
    subcategories: null,
  },
  {
    category: "Agriculture",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Agriculture.jpg`,
    subcategories: null,
  },
  {
    category: "Flowers & Decoration",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Flowers&Decoration.jpg`,
    subcategories: null,
  },
  {
    category: "Eye Wear",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/EyeWear.jpg`,
    subcategories: null,
  },
  {
    category: "Watches",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Watches.jpg`,
    subcategories: null,
  },
  {
    category: "Tattoo Shop",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/TattooShop.jpg`,
    subcategories: null,
  },
  {
    category: "Bicycle Stores",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/BicycleStores.jpg`,
    subcategories: null,
  },
  {
    category: "Paint Shop",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/PaintShop.jpg`,
    subcategories: null,
  },
  {
    category: "Artist",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Artist.jpg`,
    subcategories: {
      category: [
        { name: "Singer", image: null },
        { name: "Anchor", image: null },
        { name: "Dancer", image: null },
        { name: "Musician", image: null },
        { name: "Influencer", image: null },
        { name: "All", image: null },
      ],
      subcategory: null,
    },
  },
  {
    category: "Astrologer, Tarot card Reader, Numerology, Kundali",
    image:
    `${process.env.BASE_URL}/neargud/constants/categoriesImages/Astrologer.jpg`,
    subcategories: null,
  },
];
 
module.exports = { categories };