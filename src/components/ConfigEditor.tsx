import React, { PureComponent, ChangeEvent } from 'react';
import { FormLabel, Input, Button } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { AirthingsJsonData, AirthingsSecureJsonData } from '../types';

const AuthCodePattern = /code=([\w]+)/;

export type Props = DataSourcePluginOptionsEditorProps<AirthingsJsonData>;

type AirthingsSettings = DataSourceSettings<AirthingsJsonData, AirthingsSecureJsonData>;

export interface State {
  config: AirthingsSettings;
}

export class ConfigEditor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { options } = this.props;

    this.state = {
      config: ConfigEditor.defaults(options),
    };

    this.updateDatasource(this.state.config);
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    return {
      ...state,
      config: ConfigEditor.defaults(props.options),
    };
  }

  static defaults = (options: any) => {
    if (!options.hasOwnProperty('secureJsonData')) {
      options.secureJsonData = {};
    }

    if (!options.hasOwnProperty('jsonData')) {
      options.jsonData = {};
    }

    if (!options.hasOwnProperty('secureJsonFields')) {
      options.secureJsonFields = {};
    }

    return options;
  }

  updateDatasource = async (config: any) => {
    for (const j in config.jsonData) {
      if (config.jsonData[j].length === 0) {
        delete config.jsonData[j];
      }
    }

    for (const k in config.secureJsonData) {
      if (config.secureJsonData[k].length === 0) {
        delete config.secureJsonData[k];
      }
    }

    this.props.onOptionsChange({
      ...config,
    });
  }

  onResetAccessToken = () => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonFields: {
        ...this.state.config.secureJsonFields,
        accessToken: false,
      },
    });
  }

  onResetClientSecret = () => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonFields: {
        ...this.state.config.secureJsonFields,
        clientSecret: false,
      },
    });
  }

  onResetAuthCode = () => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonFields: {
        ...this.state.config.secureJsonFields,
        authCode: false,
      },
    });
  }

  onAccessTokenChange = (accessToken: string) => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonData: {
        ...this.state.config.secureJsonData,
        accessToken,
      },
    });
  }

  onClientIDChange = (clientID: string) => {
    this.updateDatasource({
      ...this.state.config,
      jsonData: {
        ...this.state.config.jsonData,
        clientID,
      },
    });
  }

  onClientSecretChange = (clientSecret: string) => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonData: {
        ...this.state.config.secureJsonData,
        clientSecret,
      },
    });
  }

  onAuthCodeChange = (authCode: string) => {
    this.updateDatasource({
      ...this.state.config,
      secureJsonData: {
        ...this.state.config.secureJsonData,
        authCode,
      },
    });
  }

  isLocationContainsCode = () => {
    return AuthCodePattern.test(window.location.search);
  }

  isLocationContainsError = () => {
    return /error=/.test(window.location.search);
  }

  fillAuthCodeFromLocation = () => {
    const result = AuthCodePattern.exec(window.location.search);
    const authCode = result && result.length && result[1];
    this.updateDatasource({
      ...this.state.config,
      secureJsonData: {
        ...this.state.config.secureJsonData,
        authCode,
      },
    });
  }

  getConnectHref = () => {
    const authUrl = 'https://accounts.airthings.com/authorize';
    const currentLocation = window.location.origin + window.location.pathname;
    const clientID = this.state.config.jsonData.clientID;
    const authScope = 'read:device';
    return `${authUrl}?client_id=${clientID}&response_type=code&redirect_uri=${currentLocation}&scope=${authScope}`;
  }

  render() {
    const { config } = this.state;
    const connectHref = this.getConnectHref();

    return (
      <>
        <h3 className="page-heading">Airthings API Details</h3>
        <div className="gf-form-group">
          <div className="gf-form-inline">
            <div className="gf-form">
              <FormLabel className="width-14">Client ID</FormLabel>
              <div className="width-30">
                <Input
                  className="width-30"
                  value={config.jsonData.clientID || ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => this.onClientIDChange(event.target.value)}
                />
              </div>
            </div>
          </div>
          {config.secureJsonFields.clientSecret ? (
            <div className="gf-form-inline">
              <div className="gf-form">
                <FormLabel className="width-14">Client Secret</FormLabel>
                <Input className="width-25" placeholder="Configured" disabled={true} />
              </div>
              <div className="gf-form">
                <div className="max-width-30 gf-form-inline">
                  <Button variant="secondary" type="button" onClick={this.onResetClientSecret}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="gf-form-inline">
              <div className="gf-form">
                <FormLabel className="width-14">Client Secret</FormLabel>
                <div className="width-30">
                  <Input
                    className="width-30"
                    value={config.secureJsonData.clientSecret || ''}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => this.onClientSecretChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="gf-form-group">
          <a type="button" href={connectHref}>
            <img src="public/plugins/grafana-airthings-datasource/img/connect-logo.svg" />
          </a>
        </div>
      </>
    );
  }
}
