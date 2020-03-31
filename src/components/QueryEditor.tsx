import React, {PureComponent} from 'react';
import {ExploreQueryFieldProps, SelectableValue} from '@grafana/data';
import {FormLabel, Select} from '@grafana/ui';
import {
  AirthingsQuery,
  AirthingsQueryResolution,
  AirthingsQueryType,
  AirthingsResourceId,
  AirthingsSensorType,
  QueryFormat,
  AirthingsJsonData
} from '../types';
import AirthingsDatasource from '../datasource';

const QUERYTYPE_OPTIONS: Array<SelectableValue<AirthingsQueryType>> = [
  { value: AirthingsQueryType.Devices, label: 'Devices', description: 'Device Sample Data' },
//  { value: AirthingsQueryType.Locations, label: 'Locations', description: 'Location Data' }
];

const SENSORTYPE_OPTIONS: Array<SelectableValue<AirthingsSensorType>> = [
  { value: AirthingsSensorType.All, label: 'All' },
  { value: AirthingsSensorType.Radon, label: 'Radon' },
  { value: AirthingsSensorType.CO2, label: 'Co2' },
  { value: AirthingsSensorType.TVOC, label: 'TVOC' },
  { value: AirthingsSensorType.Temp, label: 'Temp' },
  { value: AirthingsSensorType.Humidity, label: 'Humidity' },
  { value: AirthingsSensorType.Pressure, label: 'Pressure' },
  { value: AirthingsSensorType.Light, label: 'Light' },
];

const FORMAT_OPTIONS: Array<SelectableValue<QueryFormat>> = [
  { label: 'Time series', value: QueryFormat.TimeSeries },
//  { label: 'Table', value: QueryFormat.Table },
//  { label: 'World Map', value: QueryFormat.WorldMap },
];

const RESOLUTION_OPTIONS: Array<SelectableValue<AirthingsQueryResolution>> = [
  { label: 'Full', value: AirthingsQueryResolution.Full },
  { label: 'Hour', value: AirthingsQueryResolution.Hour },
  { label: 'Day', value: AirthingsQueryResolution.Day },
  { label: 'Week', value: AirthingsQueryResolution.Week },
];


export const DefaultTarget: State = {
  refId: '',
  devices: [],
  locations: [],
  queryType: AirthingsQueryType.Devices,
  sensorType: null,
  resourceId: null,
  resourceName: '',
  format: QueryFormat.TimeSeries,
  resolution: AirthingsQueryResolution.Hour,
};

export type Props = ExploreQueryFieldProps<AirthingsDatasource, AirthingsQuery, AirthingsJsonData>;

interface State extends AirthingsQuery {
  devices: any;
  locations: any;
}

export class QueryEditor extends PureComponent<Props, State> {
  state: State = DefaultTarget;

  queryDefaults: AirthingsQuery = {
    refId: null,
    resourceName: '',
    format: QueryFormat.TimeSeries,
    queryType: AirthingsQueryType.Devices,
    resourceId: null,
    sensorType: AirthingsSensorType.Temp,
    resolution: AirthingsQueryResolution.Hour,
  };

  constructor(props: Props) {
    super(props);
  }

  async componentDidMount() {
    const devicesResponse = await this.props.datasource.airthingsApi.getDevices();
    const devices = devicesResponse.devices.map( device => (
        { value: device.id, 'label': device.segment.name, 'description': device.id, 'sensors': device.sensors }
    ));
    const locationsResponse = await this.props.datasource.airthingsApi.getLocations();
    const locations = locationsResponse.locations.map( location => (
        { value: location.id, 'label': location.name, 'description': location.id }
    ));

    this.setState({ devices, locations });
    // this.onChange(this.queryDefaults);
  }

  getQueryTypeOption = () => {
    return QUERYTYPE_OPTIONS.find(v => v.value === this.props.query.queryType);
  }

  getResource = (resourceId: string) => {
    if (resourceId === null) { return null; }
    const resourceSet = (this.props.query.queryType === AirthingsQueryType.Locations) ? this.state.locations : this.state.devices;
    return resourceSet ? resourceSet.find(v => v.value === resourceId) : null;
  }

  getResourceOption = () => {
    return this.getResource(this.props.query.resourceId);
  }

  getSensorsOfSelectedResource = () => {
    if (this.props.query.queryType === AirthingsQueryType.Locations) { return SENSORTYPE_OPTIONS; }
    const selectedResource = this.getResourceOption();
    const availableSensors = selectedResource ? selectedResource.sensors + AirthingsSensorType.All : [];
    return SENSORTYPE_OPTIONS.filter(v => availableSensors.includes(v.value));
  }

  getSensorTypeOption = () => {
    return SENSORTYPE_OPTIONS.find(v => v.value === this.props.query.sensorType);
  }

  getFormatOption = () => {
    return FORMAT_OPTIONS.find(v => v.value === this.props.query.format);
  }

  getResolutionOption = () => {
    return RESOLUTION_OPTIONS.find(v => v.value === this.props.query.resolution);
  }

  onQueryTypeChanged = (option: SelectableValue<AirthingsQueryType>) => {
    const { query } = this.props;
    this.onChange({ ...query, queryType: option.value, resourceId: null, sensorType: null });
  }

  onResourceChanged = (option: SelectableValue<AirthingsResourceId>) => {
    const { query } = this.props;
    this.onChange({ ...query, resourceId: option.value, resourceName: this.getResource(option.value).label, sensorType: null });
  }

  onSensorTypeChanged = (option: SelectableValue<AirthingsSensorType>) => {
    const { query } = this.props;
    this.onChange({ ...query, sensorType: option.value });
  }

  onFormatChange = (option: SelectableValue<QueryFormat>) => {
    const { query } = this.props;
    this.onChange({ ...query, format: option.value });
  }

  onResolutionChange = (option: SelectableValue<AirthingsQueryResolution>) => {
    const { query } = this.props;
    this.onChange({ ...query, resolution: option.value });
  }

  onChange(query: AirthingsQuery) {
    const { onChange, onRunQuery } = this.props;
    onChange(query);
    onRunQuery();
  }

  render() {
    const { devices, locations } = this.state;
    return (
        <>
          <div className="gf-form-inline">
            <FormLabel width={5}>Type</FormLabel>
            <Select
                isSearchable={false}
                width={10}
                value={this.getQueryTypeOption()}
                options={QUERYTYPE_OPTIONS}
                onChange={this.onQueryTypeChanged}
                className="gf-form-select"
            />
            <FormLabel width={7}>{this.props.query.queryType === AirthingsQueryType.Locations ? 'Location' : 'Device'}</FormLabel>
            <Select
                isSearchable={false}
                width={10}
                value={this.getResourceOption()}
                options={this.props.query.queryType === AirthingsQueryType.Locations ? locations : devices}
                onChange={this.onResourceChanged}
                className="gf-form-select"
            />
            <FormLabel width={5}>Sensor</FormLabel>
            <Select
                isSearchable={false}
                width={10}
                value={this.getSensorTypeOption()}
                options={this.getSensorsOfSelectedResource()}
                onChange={this.onSensorTypeChanged}
                className="gf-form-select"
            />
          </div>
          <div className="gf-form-inline">
            <FormLabel>Format</FormLabel>
            <Select isSearchable={false} options={FORMAT_OPTIONS} onChange={this.onFormatChange} value={this.getFormatOption()} />
            <FormLabel>Resolution</FormLabel>
            <Select isSearchable={false} options={RESOLUTION_OPTIONS} onChange={this.onResolutionChange} value={this.getResolutionOption()} />
          </div>
        </>
    );
  }
}
