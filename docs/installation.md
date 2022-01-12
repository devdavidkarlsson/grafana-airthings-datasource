# Plugin Installation

#### OSX:
##### Install (pre-built release) through your terminal by:
```
brew update
brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/4e48acd1f55270fd00371e226b32184be8dbb23e/Formula/grafana.rb    # grafana 6.7.3 if you don't have it.

cd /usr/local/var/lib/grafana/plugins
git clone --single-branch --branch release-1.1.1-airthings-1.0.0 https://github.com/Airthings/grafana-airthings-datasource.git
brew services restart grafana

# The plugin should be available in the datasource section of grafana. (if not, try building from source.)
open http://localhost:3000/datasources/new
```

##### Building from source
```
## Setup prerequisites if you don't have them: ##

brew update
brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/4e48acd1f55270fd00371e226b32184be8dbb23e/Formula/grafana.rb    # grafana 6.7.3 if you don't have it.
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

