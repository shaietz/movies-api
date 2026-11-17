import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

/** supertest agent for the app: `await api().get('/api/movies')` */
export const api = () => request(app);

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
