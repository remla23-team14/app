import type {ActionArgs, LoaderArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useActionData, useLoaderData} from '@remix-run/react';

import {db} from "~/utils/db.server";
import {modelService} from '~/utils/modelservice.server';
import {metrics} from '~/utils/metrics.server';

function registerPageVisit(request: Request, restaurant: {id: string; name: string}) {
  metrics.pageVisitsCounter.labels({
    method: request.method,
    path: new URL(request.url).pathname,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
  }).inc();
}

export const action = async ({ request, params }: ActionArgs) => {
  const form = await request.formData();
  const comment = form.get("comment");
  if (typeof comment !== "string") {
    throw new Error("Invalid comment");
  }

  const restaurant = await db.restaurant.findUnique({ where: { id: params.id } });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  registerPageVisit(request, restaurant);

  const sentiment = await modelService.fetchSentiment(comment).catch(e => {
    console.error(e);
    return null;
  });

  const data = {
    restaurantId: restaurant.id,
    comment,
    sentiment,
  };

  const review = await db.review.create({ data });
  return json(review);
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    include: {
      reviews: true,
    },
  });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  registerPageVisit(request, restaurant);
  return json({ restaurant });
};

export default function Restaurant() {
  const { restaurant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  if (actionData && !restaurant.reviews.some(review => review.id === actionData.id)) {
    restaurant.reviews.push(actionData);
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">{restaurant.name}</h1>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:max-w-7xl lg:px-8 whitespace-pre">
          {restaurant.description}
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
          {restaurant.reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 border-gray-200 py-4">
              <p className="text-lg leading-8 text-gray-600">
                <span className="mr-4">{parseSentiment(review.sentiment)}</span>
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function parseSentiment(sentiment: boolean | null): string {
    if (sentiment === null) return '😵‍💫';
    return sentiment ? '😄' : '😐';
  }
}
