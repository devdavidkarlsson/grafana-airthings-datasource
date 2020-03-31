import { DataQuery, SelectableValue, DataSourceJsonData } from '@grafana/data';

export interface AirthingsJsonData extends DataSourceJsonData {
  clientID: string;
}

export interface AirthingsSecureJsonData {
  clientSecret: string;
  authCode: string;
}

export interface AirthingsQuery extends DataQuery {
  queryType: AirthingsQueryType;
  resourceId: AirthingsResourceId;
  resourceName: string;
  sensorType: AirthingsSensorType;
  format: QueryFormat;
  resolution: AirthingsQueryResolution;
}

export enum QueryFormat {
  TimeSeries = 'time_series',
  Table = 'table',
  WorldMap = 'worldmap',
}

export enum AirthingsQueryResolution {
  Full = '',
  Hour = 'HOUR',
  Day = 'DAY',
  Week = 'WEEK',
}

export enum AirthingsQueryType {
  Devices = 'Devices',
  Locations = 'Locations',
}

export enum AirthingsSensorType {
  Temp = 'temp',
  Radon = 'radonShortTermAvg',
  Humidity = 'humidity',
  Pressure = 'pressure',
  TVOC = 'voc',
  CO2 = 'co2',
  Light = 'light',
  All = 'all',
}

export type AirthingsResourceId = string | null;
