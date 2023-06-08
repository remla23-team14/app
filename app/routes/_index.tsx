import { db } from "~/utils/db.server";
import {useLoaderData} from '@remix-run/react';
import type { LoaderArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {metrics} from '~/utils/metrics.server';
import {getPublicEnv} from "~/utils/env.server";
import ColorButton from "~/components/colorbutton";

export const loader = async ({ request }: LoaderArgs) => {
  metrics.pageVisitsCounter.labels({
    method: request.method,
    path: new URL(request.url).pathname,
    restaurantId: '',
    restaurantName: '',
  }).inc();

  return json({
    restaurantCount: await db.restaurant.count(),
    ENV: getPublicEnv(),
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
          <a href="/restaurants">
            <ColorButton color={data.ENV.BUTTON_COLOR}>Explore Restaurants</ColorButton>
          </a>
        </div>
      </div>
    </div>
  )
}
