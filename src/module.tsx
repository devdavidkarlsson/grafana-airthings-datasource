import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import AirthingsDatasource from './datasource';
import { AirthingsJsonData, AirthingsQuery } from './types';

class AirthingsAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export const plugin = new DataSourcePlugin<AirthingsDatasource, AirthingsQuery, AirthingsJsonData>(
  AirthingsDatasource
)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setExploreQueryField(QueryEditor)
  .setAnnotationQueryCtrl(AirthingsAnnotationsQueryCtrl);
