import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function seed() {
  await Promise.all(
    getRestaurants().map(r => db.restaurant.create({ data: r }))
  );
}

seed();

function getRestaurants() {
  return [
    {
      name: "KFC Delft",
      description: `Restaurant chain known for its buckets of fried chicken, plus combo meals & sides.`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/KFC_logo.svg/1200px-KFC_logo.svg.png',
    },
    {
      name: "The Real Greek Delft",
      description: `The Real Greek Delft
Markt 12
2611GT Delft`,
      imageUrl: 'https://static.thuisbezorgd.nl/images/restaurants/nl/0007QO11/logo_465x320.png',
    },
    {
      name: "Dunkin' Donuts Delft",
      description: `Sip into Dunkin' and enjoy America's favorite coffee and baked goods chain.`,
      imageUrl: 'https://logos-world.net/wp-content/uploads/2020/12/Dunkin-Emblem.png',
    },
    {
      name: "McDonald's Delft",
      description: `McDonalds.com is your hub for everything McDonald's. Find out more about our menu items and promotions today!`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/McDonald%27s_logo.svg/2560px-McDonald%27s_logo.svg.png',
    },
  ];
}
