import {fetch} from '@remix-run/node';
import * as process from 'process';

class ModelService {

  private async fetchModelService(path: string, body: Record<string, any>) {
    const url = process.env.MODEL_SERVICE_URL;
    if (url == null) throw new Error('MODEL_SERVICE_URL not set');
    return fetch(`${url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json());
  }

  async predictSentiment(msg: string): Promise<boolean> {
    return this.fetchModelService('/predict', { msg }).then(res => res.result === 'true');
  }

  async toggleSentiment(msg: string, sentiment: boolean): Promise<boolean> {
    return this.fetchModelService('/toggle-sentiment', { msg, sentiment }).then(res => res.result === 'true');
  }
}

export const modelService = new ModelService();
