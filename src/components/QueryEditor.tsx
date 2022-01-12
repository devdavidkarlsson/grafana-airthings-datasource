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
  AirthingsJsonData, AirthingsOrganizationId
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
    organizations: [],
    devices: [],
    locations: [],
    queryType: AirthingsQueryType.Devices,
    sensorType: AirthingsSensorType.Temp,
    resourceId: null,
    locationId: null,
    organizationId: null,
    resourceName: '',
    format: QueryFormat.TimeSeries,
    resolution: AirthingsQueryResolution.Hour,
};

export type Props = ExploreQueryFieldProps<AirthingsDatasource, AirthingsQuery, AirthingsJsonData>;

interface State extends AirthingsQuery {
  devices: any;
  locations: any;
  organizations: any;
}

export class QueryEditor extends PureComponent<Props, State> {
  state: State = DefaultTarget;

  queryDefaults: AirthingsQuery = {
    refId: null,
    resourceName: '',
    format: QueryFormat.TimeSeries,
    queryType: AirthingsQueryType.Devices,
    resourceId: null,
    locationId: null,
    organizationId: null,
    sensorType: AirthingsSensorType.Temp,
    resolution: AirthingsQueryResolution.Hour,
  };

  constructor(props: Props) {
    super(props);
  }

  async componentDidMount() {
    const organizationsResponse = await this.props.datasource.airthingsApi.getOrganizations();
    const organizations = organizationsResponse.organizations.map( organization => (
        { value: organization.id, 'label': organization.name, 'description': organization.id }
    ));
    this.setState({ organizations });
    const organizationId = organizations.find(v => v.value === this.props.query.organizationId) ?
        this.props.query.organizationId
        : null;

    await this.getResourcesForOrganization(organizationId);
    this.onChange({ ...this.props.query, queryType: this.queryDefaults.queryType});

  }

  async getResourcesForOrganization(organizationId: AirthingsOrganizationId) {
    organizationId = organizationId || this.props.query.organizationId;
    const devicesResponse = await this.props.datasource.airthingsApi.getDevices({ organizationId });
    const devices = devicesResponse.devices.map( device => ({
          value: device.id,
          'label': device.segment.name,
          'description': device.id,
          'sensors': device.sensors,
          'locationId': device.location.id
    }));
    const locationsResponse = await this.props.datasource.airthingsApi.getLocations({ organizationId });
    const locations = locationsResponse.locations.map( location => ({
          value: location.id,
          'label': location.name,
          'description': location.id
    }));

    this.setState({ devices, locations });
  }

  getQueryTypeOption = () => {
    return QUERYTYPE_OPTIONS.find(v => v.value === this.props.query.queryType);
  }

  getOrganizationOption = () => {
    return this.state.organizations.find(v => v.value === this.props.query.organizationId); // or first?
  }

  getResource = (resourceId: string) => {
    if (resourceId === null) { return null; }
    const resourceSet = (this.props.query.queryType === AirthingsQueryType.Locations) ? this.state.locations : this.state.devices;
    return resourceSet ? resourceSet.find(v => v.value === resourceId) : null;
  }

  getLocationOption = () => {
      return this.state.locations.find(v => v.value === this.props.query.locationId);
  }

  getAvaliableLocationOptions = () => {
    return this.state.locations;
  }

  getAvaliableResourceOptions = () => {
      return this.props.query.queryType === AirthingsQueryType.Locations ?
          this.state.locations
          : this.state.devices.filter(device => device.locationId === this.props.query.locationId);
  }

  getResourceOption = () => {
    return this.getResource(this.props.query.resourceId);
  }

  getSensorsOfSelectedResource = (): Array<SelectableValue<AirthingsSensorType>> => {
    if (this.props.query.queryType === AirthingsQueryType.Locations) { return SENSORTYPE_OPTIONS; }
    const selectedResource = this.getResourceOption();
    const availableDeviceSensors = selectedResource ? selectedResource.sensors + AirthingsSensorType.All : [];
    const nonListedSensors = selectedResource ? selectedResource
        .sensors
        .filter(sensor => SENSORTYPE_OPTIONS.map(listedSensor => listedSensor.value).indexOf(sensor) === -1) : [];
    const listedSensors = SENSORTYPE_OPTIONS.filter(v => availableDeviceSensors.includes(v.value));
    const selectableSensors = [ ...listedSensors, ...nonListedSensors.map(sensor => ({value: sensor, label: sensor})) ];
    return selectableSensors ? selectableSensors : [];
  }

  getSensorTypeOption = () => {
    return this.getSensorsOfSelectedResource().find(v => v.value === this.props.query.sensorType);
  }

  getFormatOption = () => {
    return FORMAT_OPTIONS.find(v => v.value === this.props.query.format);
  }

  getResolutionOption = () => {
    return RESOLUTION_OPTIONS.find(v => v.value === this.props.query.resolution);
  }

  onLocationChanged = (option: SelectableValue<AirthingsResourceId>) => {
    const { query } = this.props;
    this.onChange({ ...query, locationId: option.value, resourceId: null });
  }

  onQueryTypeChanged = (option: SelectableValue<AirthingsQueryType>) => {
    const { query } = this.props;
    this.onChange({ ...query, queryType: option.value, resourceId: null, sensorType: null });
  }

  onResourceChanged = (option: SelectableValue<AirthingsResourceId>) => {
    const { query } = this.props;
    this.onChange({
      ...query,
      resourceId: option.value,
      resourceName: this.getResource(option.value).label
    });
  }

  onSensorTypeChanged = (option: SelectableValue<AirthingsSensorType>) => {
    const { query } = this.props;
    this.onChange({ ...query, sensorType: option.value });
  }

  onOrganizationChanged = (option: SelectableValue<AirthingsOrganizationId>) => {
    const { query } = this.props;
    this.onChange({ ...query, organizationId: option.value, locationId: null, resourceId: null});
    this.getResourcesForOrganization(option.value);
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
    const {organizations } = this.state;
    return (
        <>
          <div className="gf-form-inline">
            <FormLabel width={10}>Organization</FormLabel>
            <Select
                isSearchable={false}
                width={15}
                value={this.getOrganizationOption()}
                options={organizations}
                onChange={this.onOrganizationChanged}
                className="gf-form-select"
            />
            { QUERYTYPE_OPTIONS.length > 1 &&
                <span>
                    <FormLabel width={10}>Type</FormLabel>
                    <Select
                        isSearchable={false}
                        width={10}
                        value={this.getQueryTypeOption()}
                        options={QUERYTYPE_OPTIONS}
                        onChange={this.onQueryTypeChanged}
                        className="gf-form-select"
                    />
                </span>
            }
            <FormLabel width={10}>Location</FormLabel>
              <Select
                  isSearchable={false}
                  width={10}
                  value={this.getLocationOption()}
                  options={this.getAvaliableLocationOptions()}
                  onChange={this.onLocationChanged}
                  className="gf-form-select"
              />
          </div>
          <div className="gf-form-inline">
            <FormLabel width={10}>{this.props.query.queryType === AirthingsQueryType.Locations ? 'Location' : 'Device'}</FormLabel>
            <Select
                isSearchable={false}
                width={15}
                value={this.getResourceOption()}
                options={this.getAvaliableResourceOptions()}
                onChange={this.onResourceChanged}
                className="gf-form-select"
            />
            <FormLabel width={10}>Sensor</FormLabel>
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
            <FormLabel width={10}>Format</FormLabel>
            <Select
              isSearchable={false}
              width={15}
              options={FORMAT_OPTIONS}
              onChange={this.onFormatChange} value={this.getFormatOption()}
            />
            <FormLabel width={10}>Resolution</FormLabel>
            <Select
              isSearchable={false}
              width={10}
              options={RESOLUTION_OPTIONS}
              onChange={this.onResolutionChange} value={this.getResolutionOption()}
            />
          </div>
        </>
    );
  }
}
