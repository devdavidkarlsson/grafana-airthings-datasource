package main

import (
	"os"
	"path/filepath"
	"time"

	"github.com/grafana/grafana-plugin-model/go/datasource"
	hclog "github.com/hashicorp/go-hclog"
	plugin "github.com/hashicorp/go-plugin"
	cache "github.com/patrickmn/go-cache"
)

var tokenStoragePath = "/var/lib/grafana/airthings"

var pluginLogger = hclog.New(&hclog.LoggerOptions{
	Name:  "airthings-datasource",
	Level: hclog.LevelFromString("DEBUG"),
})

func main() {
	pluginLogger.Debug("Running Airthings backend datasource")

	var dataDir string
	err := os.Mkdir(tokenStoragePath, os.ModePerm)

	if err == nil || os.IsExist(err) {
		dataDir = tokenStoragePath
	} else {
		// If failed to ensure dir, default to dist folder:
		dataDir, _ = filepath.Abs(filepath.Dir(os.Args[0]))
	}

	pluginLogger.Debug("Plugin data dir", "path", dataDir)

	plugin.Serve(&plugin.ServeConfig{
		HandshakeConfig: plugin.HandshakeConfig{
			ProtocolVersion:  1,
			MagicCookieKey:   "grafana_plugin_type",
			MagicCookieValue: "datasource",
		},
		Plugins: map[string]plugin.Plugin{
			"airthings-backend-datasource": &datasource.DatasourcePluginImpl{Plugin: &AirthingsPlugin{
				datasourceCache: cache.New(10*time.Minute, 10*time.Minute),
				logger:          pluginLogger,
				dataDir:         dataDir,
			}},
		},

		// A non-nil value here enables gRPC serving for this plugin...
		GRPCServer: plugin.DefaultGRPCServer,
	})
}
