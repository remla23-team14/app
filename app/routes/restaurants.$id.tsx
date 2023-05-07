import type {ActionArgs, LoaderArgs} from '@remix-run/node';
import {json, redirect} from '@remix-run/node';
import {useLoaderData} from "@remix-run/react";

import { db } from "~/utils/db.server";

export const action = async ({ request, params }: ActionArgs) => {
  const form = await request.formData();
  const comment = form.get("comment");
  const restaurantId = params.id;
  if (typeof comment !== "string" || typeof restaurantId !== "string") {
    throw new Error("Invalid comment or restaurant");
  }

  const fields = {
    restaurantId,
    comment,
  };

  await db.review.create({ data: fields });
  return redirect(`/restaurants/${restaurantId}`);
};

export const loader = async ({ params }: LoaderArgs) => {
  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    include: {
      reviews: true,
    },
  });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }
  return json({ restaurant });
};

export default function Restaurant() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">{data.restaurant.name}</h1>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:max-w-7xl lg:px-8 whitespace-pre">
          {data.restaurant.description}
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Add Your Review</h2>
        <form method="post" className="min-w-[400px]">
          <div className="mt-2 flex">
            <textarea id="comment" name="comment" rows={3} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"></textarea>
          </div>
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
          </div>
        </form>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Reviews</h2>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          {data.restaurant.reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 border-gray-200 py-4">
              <p className="text-lg leading-8 text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
