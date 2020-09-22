import { DataQuery, SelectableValue, DataSourceJsonData } from '@grafana/data';

export interface AirthingsJsonData extends DataSourceJsonData {
  authType: AuthType;
  clientID: string;
}

export interface AirthingsSecureJsonData {
  clientSecret: string;
  authCode: string;
}

export interface AirthingsQuery extends DataQuery {
  organizationId: AirthingsOrganizationId;
  queryType: AirthingsQueryType;
  locationId: AirthingsResourceId;
  resourceId: AirthingsResourceId;
  resourceName: string;
  sensorType: AirthingsSensorType;
  format: QueryFormat;
  resolution: AirthingsQueryResolution;
}

export enum AuthType {
  CodeFlow = 'authorization_code',
  ClientCredentials = 'client_credentials',
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
export type AirthingsOrganizationId = string | null;
