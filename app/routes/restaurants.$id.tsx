import type {ActionArgs, LoaderArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';

import {db} from "~/utils/db.server";
import {modelService} from '~/utils/modelservice.server';
import {metrics} from '~/utils/metrics.server';
import Back from '~/components/back';
import {getPublicEnv} from "~/utils/env.server";
import ColorButton from "~/components/colorbutton";

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

  review.sentiment = await modelService.toggleSentiment(review.comment, !review.sentiment).catch(e => {
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
  return json({
    restaurant,
    ENV: getPublicEnv(),
  });
};

export default function Restaurant() {
  const { restaurant, ENV } = useLoaderData<typeof loader>();
  const [positiveCount, negativeCount] = restaurant.reviews.reduce(([pos, neg], { sentiment }) => {
    if (sentiment == null) return [pos, neg];
    return sentiment ? [pos + 1, neg] : [pos, neg + 1];
  }, [0, 0]);

  return (
    <div className="m-16 mt-0">
      <div className="flex gap-24 flex-row">
        <div className="basis-1/2">
          <div className="flex flex-row items-center gap-8">
            <div className="flex-initial">
              <Back to="/restaurants" color={ENV.BUTTON_COLOR} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">{restaurant.name}</h1>
          </div>
          <div className="max-w-2xl py-8">
            {restaurant.description}
          </div>

          <div className="py-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Statistics</h2>
            <div className="flex flex-col text-center min-w-[400px] p-4 pl-0 gap-2 font-semibold">
              <div className="flex flex-row gap-4">
                <span>😄</span>
                <span>{positiveCount}</span>
              </div>
              <div className="flex flex-row gap-4">
                <span>😐</span>
                <span>{negativeCount}</span>
              </div>
            </div>
          </div>

          <div className="py-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Add Your Review</h2>
            <form method="post" className="min-w-[400px] max-w-2xl">
              <div className="mt-2 flex">
                <textarea id="comment" name="comment" rows={3} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"></textarea>
              </div>
              <div className="mt-4 flex items-center gap-x-6">
                <button type="submit">
                  <ColorButton color={ENV.BUTTON_COLOR}>Save</ColorButton>
                </button>
              </div>
              <input type="hidden" name="action" value="add-review" />
            </form>
          </div>
        </div>
        <div className="basis-1/2">
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Reviews</h2>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              {restaurant.reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 border-gray-200 py-4">
                  <div className="flex gap-4 text-lg leading-8 text-gray-600 min-w-[400px]">
                    <span>{parseSentiment(review.sentiment)}</span>
                    <p className="grow inline-block">{review.comment}</p>
                    <form method="post" className="inline-block">
                      <button type="submit" className="">
                        <ColorButton color={ENV.BUTTON_COLOR}>
                          {review.sentiment == null ? 'Refresh' : 'Toggle'}
                        </ColorButton>
                      </button>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value={review.sentiment == null ? 'refresh-sentiment' : 'toggle-sentiment'} />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function parseSentiment(sentiment: boolean | null): string {
    if (sentiment === null) return '😵‍💫';
    return sentiment ? '😄' : '😐';
  }
}
