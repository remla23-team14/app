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

async function handleAddComment({request, params}: ActionArgs, form: FormData) {
  const comment = form.get("comment");
  if (typeof comment !== "string") {
    throw new Error("Invalid comment");
  }

  const restaurant = await db.restaurant.findUnique({ where: { id: params.id } });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  registerPageVisit(request, restaurant);

  const sentiment = await modelService.predictSentiment(comment).catch(e => {
    console.error(e);
    return null;
  });

  const data = {
    restaurantId: restaurant.id,
    comment,
    sentiment,
  };

  const review = await db.review.create({ data });
  return { review };
}

async function handleRefreshSentiment({request, params}: ActionArgs, form: FormData) {
  const reviewId = form.get("reviewId");
  if (typeof reviewId !== "string") throw new Error("Invalid reviewId");

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");

  review.sentiment = await modelService.predictSentiment(review.comment).catch(e => {
    console.error(e);
    return null;
  });
  await db.review.update({ where: { id: reviewId }, data: review });

  return { review };
}

async function handleToggleSentiment({request, params}: ActionArgs, form: FormData) {
  const reviewId = form.get("reviewId");
  if (typeof reviewId !== "string") throw new Error("Invalid reviewId");

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.sentiment == null) throw new Error("Review has no sentiment");

  review.sentiment = await modelService.toggleSentiment(review.comment, review.sentiment).catch(e => {
    console.error(e);
    return review.sentiment;
  });
  await db.review.update({ where: { id: reviewId }, data: review });

  return { review };
}

export const action = async (args: ActionArgs) => {
  const form = await args.request.formData();
  const action = form.get("action");

  let data = null;
  switch (action) {
    case "add-review":
      data = await handleAddComment(args, form);
      break;
    case "refresh-sentiment":
      data = await handleRefreshSentiment(args, form);
      break;
    case "toggle-sentiment":
      data = await handleToggleSentiment(args, form);
      break;
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }

  return json({ action, data });
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
  if (actionData != null && 'action' in actionData && actionData.data != null) {
    switch (actionData.action) {
      case 'add-review':
        // const { review } = actionData.data;
        // if (!restaurant.reviews.some(r => r.id === review.id)) {
        //   restaurant.reviews.push(review);
        // }
        // break;
      case 'refresh-sentiment':
        break;
      case 'toggle-sentiment':
        break;
    }
  }

  const [positiveCount, negativeCount] = restaurant.reviews.reduce(([pos, neg], { sentiment }) => {
    if (sentiment == null) return [pos, neg];
    return sentiment ? [pos + 1, neg] : [pos, neg + 1];
  }, [0, 0]);

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
          <div className="mt-4 flex items-center justify-center gap-x-6">
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
          </div>
          <input type="hidden" name="action" value="add-review" />
        </form>
        <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Reviews</h2>
        <div className="flex flex-row text-center min-w-[400px] mt-4 mb-4">
          <div className="basis-1/2">😄 {positiveCount}</div>
          <div className="basis-1/2">😐 {negativeCount}</div>
        </div>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          {restaurant.reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 border-gray-200 py-4">
              <div className="flex text-lg leading-8 text-gray-600 min-w-[400px]">
                <span className="mr-4">{parseSentiment(review.sentiment)}</span>
                <p className="grow inline-block">{review.comment}</p>
                <form method="post" className="ml-4 inline-block">
                  <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{review.sentiment == null ? 'Refresh' : 'Toggle'}</button>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="action" value={review.sentiment == null ? 'refresh-sentiment' : 'toggle-sentiment'} />
                </form>
              </div>
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
