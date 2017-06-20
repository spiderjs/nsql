export * from './api';
export * from './context';
export * from './nsql';
export * from './orm';
import * as nsql from './nsql';

export const datasource = new nsql.DataSource();
