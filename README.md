# Airthings datasource for Grafana dashboard

Visualize your air with Grafana.

![Airthings Datasource](docs/img/dashboard-example.png)

Features:

- Query Airthings sensor data and present as a time series data.

### Configuration

See [configuration](https://github.com/devdavidkarlsson/grafana-airthings-datasource/blob/master/docs/configuration.md) docs.

### Quick start

Before you start grafana server, configure plugin data directory with `GF_AIRTHINGS_DS_DATA_PATH` environment variable. This required for storing obtained refresh tokens and make it available after plugin restart. Default path is plugin directory, but it will be removed during plugin upgrade, so for persistent storage it's better to use grafana data directory. Example:

```sh
mkdir /var/lib/grafana/airthings
export GF_AIRTHINGS_DS_DATA_PATH=/var/lib/grafana/airthings
```

Note: Airthings API is currently only available for use with Airthings for Business API-clients and devices.

#### Original source code
This plugin is based on the code in the [strava-datasource](https://github.com/grafana/strava-datasource).
I am in no way affiliated with Grafana.
