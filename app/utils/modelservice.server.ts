import {fetch} from '@remix-run/node';
import * as process from 'process';

class ModelService {
  fetchSentiment(msg: string): Promise<boolean> {
    const url = process.env.MODEL_SERVICE_URL;
    if (url == null) throw new Error('MODEL_SERVICE_URL not set');
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ msg }),
    })
      .then(res => res.json())
      .then(res => res.result === 'true');
  }
}

export const modelService = new ModelService();
