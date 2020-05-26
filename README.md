# Airthings datasource for Grafana dashboard

Visualize your air with Grafana.

![Airthings Datasource](docs/img/dashboard-example.png)

Features:

- Query Airthings sensor data and present as a time series data.

### Installation

See [installation](https://github.com/devdavidkarlsson/grafana-airthings-datasource/blob/master/docs/installation.md) docs.

### Quick start

Before you start grafana server, mount a persistent folder in /var/lib/grafana/airthings.
This required for storing obtained refresh tokens, that are used to maintain access to the API when the access token expires.

Note: Airthings API is currently only available for use with Airthings for Business API-clients and devices.

### Configuration

See [configuration](https://github.com/devdavidkarlsson/grafana-airthings-datasource/blob/master/docs/configuration.md) docs.


#### Original source code
This plugin is based on the code in the [strava-datasource](https://github.com/grafana/strava-datasource).
I am in no way affiliated with Grafana.
