import express from 'express';
import prom from '@isaacs/express-prometheus-middleware';
import type {Express} from 'express-serve-static-core';
import * as Prometheus from 'prom-client';
import {db} from '~/utils/db.server';

declare global {
  var __metrics__: Metrics | undefined;
}

class Metrics {
  public pageVisitsCounter: Prometheus.Counter<string>;
  public metricsApp: Promise<Express>;
  public registered: boolean = false;

  constructor() {
    this.pageVisitsCounter = new Prometheus.Counter({
      name: 'app_page_visits',
      help: 'Total number of visits',
      labelNames: ['method', 'path', 'restaurantId', 'restaurantName'],
    });
    this.metricsApp = this.createMetricsApp();
  }

  public async registerMetrics(): Promise<void> {
    if (this.registered) return;
    this.registered = true;

    const app = await this.metricsApp;
    app.listen(process.env.METRICS_PORT || 9091, () => {
      console.log(`✅ metrics ready`);
    });
  }

  private async createMetricsApp(): Promise<Express> {
    const metricsApp = express();
    metricsApp.use(
      prom({
        metricsPath: '/metrics',
        prefix: 'app_',
      }),
    );

    const restaurantLabels = new Map<string, string>();
    for (const { id, name } of await db.restaurant.findMany()) {
      restaurantLabels.set(id, `${id}_${name.replace(/\W/gm, "")}`);
    }

    return metricsApp;
  }
}

let metrics: Metrics;
if (global.__metrics__) {
  metrics = global.__metrics__;
} else {
  metrics = new Metrics();
  metrics.registerMetrics();
  global.__metrics__ = metrics;
}

export { metrics };
