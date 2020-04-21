# Plugin Installation

#### OSX:

Install through your terminal by:
```
## Setup prerequisites if you don't have them: ##

brew update
brew install grafana    # if you don't have it.
brew install go         # if you don't have it.

## Build the plugin: ##

cd /usr/local/var/lib/grafana/plugins
git clone git@github.com:devdavidkarlsson/grafana-airthings-datasource.git
cd grafana-airthings-datasource
make install
make dist

## Start/restart Grafana: ##

brew services restart grafana

## The data source should be available (in the bottom of the list) at: ##
open http://localhost:3000/datasources/new
```
---
Now you can proceed with configuring the Data source.
See [configuration](https://github.com/devdavidkarlsson/grafana-airthings-datasource/blob/master/docs/configuration.md) docs.

