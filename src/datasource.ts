import {
  DataQueryRequest,
  DataSourceApi,
  DataSourceInstanceSettings,
  dateTime,
  TableData,
  TimeRange,
  TimeSeries,
  TimeSeriesPoints,
  TimeSeriesValue
} from "@grafana/data";
import AirthingsApi from "./airthingsApi";
import polyline from './polyline';
import {AirthingsQuery, AirthingsQueryType, AirthingsSensorType, AirthingsJsonData, AirthingsQueryResolution} from "./types";
import moment from "moment";

let zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]);


export default class AirthingsDatasource extends DataSourceApi<AirthingsQuery, AirthingsJsonData> {
  type: any;
  datasourceId: number;
  apiUrl: string;
  datasourceName: string;
  airthingsApi: AirthingsApi;

  /** @ngInject */
  constructor(
    instanceSettings: DataSourceInstanceSettings<AirthingsJsonData>,
    private templateSrv: any,
    private timeSrv: any
  ) {
    super(instanceSettings);
    this.type = "airthings";
    this.datasourceId = instanceSettings.id;
    this.apiUrl = instanceSettings.url;
    this.airthingsApi = new AirthingsApi(this.datasourceId);
  }

  parseSelectedSensorSamples(params?: any, response?: any) {
    const data = [];
    const timestamps = response.data.time.map(stamp => stamp * 1000);
    delete response.data.time;
    const sensors = (params.sensorType === AirthingsSensorType.All ? Object.keys(response.data) : [params.sensorType]);
    for (const sensor of sensors) {
      const samples = response.data[sensor];
      data.push({
        target: `${params.resourceName} - ${sensor}`,
        datapoints: zip(samples, timestamps)
      });
    }
    return data;
  }

  async query(options: DataQueryRequest<AirthingsQuery>) {
    const data = [];
    for (const target of options.targets) {
      if (target.queryType === null || target.resourceId === null || target.sensorType === null) { continue; }
      switch (target.queryType) {
        case AirthingsQueryType.Devices:
          const params = {
            resourceId: target.resourceId,
            resourceName: target.resourceName,
            resolution: target.resolution,
            sensorType: target.sensorType,
            start: options.range.from.unix(),
            end: options.range.to.unix,
          };
          const deviceSamples = await this.airthingsApi.getDeviceSamples(params);

          const selectedSensorSamples = this.parseSelectedSensorSamples(params, deviceSamples);
          for (const sensorSamples of selectedSensorSamples) {
            data.push(sensorSamples);
          }
          break;

        case AirthingsQueryType.Locations:
          const locationSamples = await this.airthingsApi.getLocationLatestSamples({
            resourceId: target.resourceId,
            sensorType: target.sensorType,
            resourceName: target.resourceName,
            start: options.range.from.unix(),
            end: options.range.to.unix
          });
          data.push(locationSamples);
          break;
      }
    }
    /*const activities = await this.airthingsApi.getActivities({
      before: options.range.to.unix(),
      after: options.range.from.unix(),
    });

    for (const target of options.targets) {
      const filteredActivities = this.filterActivities(activities, target.sensorType);
      switch (target.format) {
        case QueryFormat.Table:
          const tableData = this.transformActivitiesToTable(filteredActivities, target);
          data.push(tableData);
          break;
        case QueryFormat.WorldMap:
          const wmData = this.transformActivitiesToWorldMap(filteredActivities, target);
          data.push(wmData);
          break;
        default:
          const tsData = this.transformActivitiesToTimeseries(filteredActivities, target, options.range);
          data.push(tsData);
          break;
      }
    }*/

    return { data };
  }

  async testDatasource() {
    const authCode = this.getAuthCode();
    if (authCode) {
      // Exchange auth code for new refresh token if "Connect with Airthings" button clicked
      try {
        await this.airthingsApi.exchangeToken(authCode);
      } catch (err) {
        console.log(err);
      }
    }

    try {
      await this.airthingsApi.getOrganizations({ per_page: 2, limit: 2});
      return { status: "success", message: "Data source is working" };
    } catch (err) {
      return { status: "error", message: "Cannot connect to Airthings API" };
    }
  }

  getAuthCode() {
    const AuthCodePattern = /code=([A-Za-z0-9\-]+)/;
    const result = AuthCodePattern.exec(window.location.search);
    const authCode = result && result.length && result[1];
    if (authCode === null){ console.log("failed to get auth code :("); }
    return authCode;
  }

  filterActivities(activities: any[], sensorType: AirthingsSensorType): any[] {
    if (!sensorType) {
      // No filter, return all
      return activities;
    }

    return activities.filter(activity => {
      if (sensorType === AirthingsSensorType.All) {
        return activity.type !== 'Run' && activity.type !== 'Ride';
      } else {}
      return activity.type === sensorType;
    });
  }

  transformActivitiesToTable(data: any[], target: AirthingsQuery) {
    const table: TableData = {
      type: 'table',
      columns: [
        { text: 'Time'},
        { text: 'name' },
        { text: 'distance', unit: 'lengthm' },
        { text: 'moving_time', unit: 's' },
        { text: 'elapsed_time', unit: 's' },
        { text: 'total_elevation_gain', unit: 'lengthm' },
        { text: 'type' },
        { text: 'kilojoules', unit: 'joule' },
      ],
      rows: []
    };

    for (const activity of data) {
      const row = [
        dateTime(activity.start_date),
        activity.name,
        activity.distance,
        activity.moving_time,
        activity.elapsed_time,
        activity.total_elevation_gain,
        activity.type,
        activity.kilojoules,
      ];
      table.rows.push(row);
    }
    return table;
  }

  transformActivitiesToWorldMap(data: any[], target: AirthingsQuery) {
    const unit = null;
    const table: TableData = {
      type: 'table',
      columns: [
        { text: 'value', unit },
        { text: 'name' },
        { text: 'latitude' },
        { text: 'longitude' },
      ],
      rows: []
    };

    for (const activity of data) {
      const middlePoint = getActivityMiddlePoint(activity);
      const latitude = middlePoint ? middlePoint[0] : activity.start_latitude;
      const longitude = middlePoint ? middlePoint[1] : activity.start_longitude;
      const row = [
        activity[target.resourceId],
        activity.name,
        latitude,
        longitude,
      ];
      if (activity.start_latitude && activity.start_longitude) {
        table.rows.push(row);
      }
    }
    return table;
  }
}

function getActivityMiddlePoint(activity: any): number[] {
  if (!activity.map || !activity.map.summary_polyline) {
    return null;
  }

  const summaryPolyline = activity.map.summary_polyline;
  const points = polyline.decode(summaryPolyline);
  if (points && points.length) {
    const middleIndex = Math.floor(points.length / 2);
    return points[middleIndex];
  } else {
    return null;
  }
}

const INTERVAL_1h = 3600000;
const INTERVAL_1d = 86400000;
const INTERVAL_1w = 604800000;
const INTERVAL_4w = 2419200000;

function getAggregationInterval(range: TimeRange): number {
  const interval = range.to.unix() - range.from.unix();
  const interval_ms = interval * 1000;
  switch (true) {
    // 4d
    case interval_ms <= 345600000:
      return INTERVAL_1h; // 1h
    // 90d
    case interval_ms <= 7776000000:
      return INTERVAL_1d; // 1d
    // 1y
    case interval_ms <= 31536000000:
      return INTERVAL_1w; // 1w
    default:
      return INTERVAL_4w; // 4w
  }
}

function getAggregationIntervalFromTarget(target: AirthingsQuery): number {
  switch (target.resolution) {
    case AirthingsQueryResolution.Hour:
      return INTERVAL_1h;
    case AirthingsQueryResolution.Day:
      return INTERVAL_1d;
    case AirthingsQueryResolution.Week:
      return INTERVAL_1w;
    default:
      return INTERVAL_4w;
  }
}

const POINT_VALUE = 0;
const POINT_TIMESTAMP = 1;

const AGG_SUM = (values: TimeSeriesValue[]) => {
  return values.reduce((acc, val) => acc + val);
};

export function groupBySum(datapoints: TimeSeriesPoints, range: TimeRange, interval: number): TimeSeriesPoints {
  return groupByTime(datapoints, range, interval, getPointTimeFrame, getNextTimeFrame, AGG_SUM);
}

export function groupByWeekSum(datapoints: TimeSeriesPoints, range: TimeRange): TimeSeriesPoints {
  return groupByTime(datapoints, range, null, getClosestWeek, getNextWeek, AGG_SUM);
}

export function groupByMonthSum(datapoints: TimeSeriesPoints, range: TimeRange): TimeSeriesPoints {
  return groupByTime(datapoints, range, null, getClosestMonth, getNextMonth, AGG_SUM);
}

export function groupByTime(datapoints: any[], range: TimeRange, interval: number, intervalFn, nextIntervalFn, groupByFn): any[] {
  if (datapoints.length === 0) {
    return [];
  }

  const time_from = range.from.unix() * 1000;
  const time_to = range.to.unix() * 1000;
  let grouped_series = [];
  let frame_values = [];
  let frame_value;
  let frame_ts = datapoints.length ? intervalFn(time_from, interval) : 0;
  let point_frame_ts = frame_ts;
  let point;

  for (let i = 0; i < datapoints.length; i++) {
    point = datapoints[i];
    point_frame_ts = intervalFn(point[POINT_TIMESTAMP], interval);
    if (point_frame_ts === frame_ts) {
      frame_values.push(point[POINT_VALUE]);
    } else if (point_frame_ts > frame_ts) {
      frame_value = frame_values.length ? groupByFn(frame_values) : null;
      grouped_series.push([frame_value, frame_ts]);

      // Move frame window to next non-empty resolution and fill empty by null
      frame_ts = nextIntervalFn(frame_ts, interval);
      while (frame_ts < point_frame_ts) {
        grouped_series.push([null, frame_ts]);
        frame_ts = nextIntervalFn(frame_ts, interval);
      }
      frame_values = [point[POINT_VALUE]];
    }
  }

  frame_value = groupByFn(frame_values);
  grouped_series.push([frame_value, frame_ts]);

  // Move frame window to end of time range and fill empty by null
  frame_ts = nextIntervalFn(frame_ts, interval);
  while (frame_ts < time_to) {
    grouped_series.push([null, frame_ts]);
    frame_ts = nextIntervalFn(frame_ts, interval);
  }

  return grouped_series;
}

function getPointTimeFrame(timestamp, ms_interval) {
  return Math.floor(timestamp / ms_interval) * ms_interval;
}

function getNextTimeFrame(timestamp, ms_interval) {
  return timestamp + ms_interval;
}

function getClosestMonth(timestamp): number {
  const month_time = moment(timestamp).startOf('month');
  return month_time.unix() * 1000;
}

function getNextMonth(timestamp): number {
  const next_month_time = moment(timestamp).add(1, 'month');
  return next_month_time.unix() * 1000;
}

function getClosestWeek(timestamp): number {
  // The first Monday after the Unix Epoch begins on Jan 5, 1970, 00:00.
  // This is a UNIX timestamp of 96 hours or 345600000 ms
  const FIRST_MONDAY_MS = 345600000;
  const week_ts = timestamp - FIRST_MONDAY_MS;
  return Math.floor(week_ts / INTERVAL_1w) * INTERVAL_1w + FIRST_MONDAY_MS;
}

function getNextWeek(timestamp): number {
  return timestamp + INTERVAL_1w;
}
