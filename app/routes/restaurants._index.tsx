import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";

export const loader = async () => {
  return json({
    restaurants: await db.restaurant.findMany(),
  });
};

export default function RestaurantsIndex() {
  const data = useLoaderData<typeof loader>();
  const restaurantsMarkup = data.restaurants.map((restaurant) => (
    <a key={`${restaurant.id}`} href={`./restaurants/${restaurant.id}`} className="group">
      <div
        className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg xl:aspect-h-8 xl:aspect-w-7">
        <img
          src={restaurant.imageUrl}
          alt={`${restaurant.name} Restaurant`}
          className="h-full w-full object-contain object-center group-hover:opacity-75"
        />
      </div>
      <h3 className="mt-4 text-sm text-gray-700">{restaurant.name}</h3>
      <p className="mt-1 text-lg font-medium text-gray-900">{restaurant.description}</p>
    </a>
  ));
  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Restaurants</h1>
      </div>
      <main>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {restaurantsMarkup}
          </div>
        </div>
      </main>
    </div>
  );
}
