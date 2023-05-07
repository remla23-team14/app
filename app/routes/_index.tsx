import { db } from "~/utils/db.server";
import {useLoaderData} from '@remix-run/react';
import {json} from '@remix-run/node';

export const loader = async () => {
  return json({
    restaurantCount: await db.restaurant.count(),
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">{data.restaurantCount} Restaurants</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">Add your review to our selection of great restaurants in the neighbourhood of Delft!</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a href="/restaurants" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Explore Restaurants</a>
        </div>
      </div>
    </div>
  )
}
