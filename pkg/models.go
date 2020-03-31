package main

import (
	"net/http"

	"github.com/grafana/grafana-plugin-model/go/datasource"
	hclog "github.com/hashicorp/go-hclog"
	plugin "github.com/hashicorp/go-plugin"
	cache "github.com/patrickmn/go-cache"
)

// AirthingsPlugin implements the Grafana backend interface and forwards queries to the AirthingsDatasource
type AirthingsPlugin struct {
	plugin.NetRPCUnsupportedPlugin
	logger          hclog.Logger
	datasourceCache *cache.Cache
	dataDir         string
}

// AirthingsDatasource stores state about a specific datasource and provides methods to make
// requests to the Airthings API
type AirthingsApiDatasource struct {
	dsInfo       *datasource.DatasourceInfo
	refreshToken string
	cache        *DSCache
	logger       hclog.Logger
	httpClient   *http.Client
}

type TokenExchangeResponse struct {
	AccessToken      string `json:"access_token"`
	AccessTokenExpAt int64  `json:"expires_at"`
	RefreshToken     string `json:"refresh_token"`
}
