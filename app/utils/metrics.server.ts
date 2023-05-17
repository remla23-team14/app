import express from 'express';
import prom from '@isaacs/express-prometheus-middleware';
import type {Express} from 'express-serve-static-core';

declare global {
  var __metricsApp__: Express | undefined;
}

class Metrics {
  init() {
    if (!global.__metricsApp__ && process.env.ENABLE_METRICS === 'true') {
      global.__metricsApp__ = createMetricsApp();
    }
  }
}

function createMetricsApp(): Express {
  const metricsApp = express();
  metricsApp.use(
    prom({
      metricsPath: "/metrics",
      collectDefaultMetrics: true,
      prefix: 'app_',
    }),
  );

  const metricsPort = process.env.METRICS_PORT || 9091;
  metricsApp.listen(metricsPort, () => {
    console.log(`✅ metrics ready`);
  });
  return metricsApp;
}

export const metrics = new Metrics();
