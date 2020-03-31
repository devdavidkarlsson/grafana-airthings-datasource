import {getBackendSrv} from '@grafana/runtime';

export default class AirthingsApi {
  datasourceId: number;
  apiUrl: string;
  promises: any;

  constructor(datasourceId: number) {
    this.datasourceId = datasourceId;
    // this.apiUrl = url;
    this.promises = {};
  }

  async getLocationLatestSamples(params?: any) {
    return await this.requestWithPagination(`locations/${params.resourceId}/latest-samples`, params);
  }

  async getDeviceSamples(params?: any) {
    return await this.tsdbRequest(`devices/${params.resourceId}/samples?resolution=${params.resolution}`, params);
    //return await this.requestWithPagination(`devices/${params.resourceId}/samples`, params);
  }

  async getOrganizations(params?: any) {
    return await this.requestWithPagination('organizations', params);
  }

  async getDevices(params?: any) {
    return await this.tsdbRequest('devices', params);
  }

  async getLocations(params?: any) {
    return await this.tsdbRequest('locations', params);
  }

  async requestWithPagination(url: string, params?: any) {
    let data = [];
    let chunk = [];
    let page = 1;
    const limit = params && params.limit;
    const per_page = params && params.per_page || 200;
    while (!(chunk.length === 0 && page !== 1) && !(limit && data.length >= limit)) {
      params = {
        ...params,
        per_page,
        page,
      };
      try {
        chunk = await this.tsdbRequest(url, params);
      } catch (error) {
        throw error;
      }
      data = data.concat(chunk);
      page++;
    }
    return data;
  }

  async exchangeToken(authCode) {
    const redirectUri = window.location.origin + window.location.pathname;
    return await this.tsdbAuthRequest({ authCode, redirectUri });
  }

  async tsdbRequest(endpoint: string, params?: any) {
    return this.proxyfy(this._tsdbRequest, '_tsdbRequest', this)(endpoint, params);
  }

  async _tsdbRequest(endpoint: string, params?: any) {
    try {
      const tsdbRequestData = {
        queries: [{
          datasourceId: this.datasourceId,
          queryType: 'airthingsApi',
          target: {
            endpoint,
            params,
          },
        }],
      };

      const response = await getBackendSrv().datasourceRequest({
        url: '/api/tsdb/query',
        method: 'POST',
        data: tsdbRequestData
      });
      // console.log(response);
      return this.handleTsdbResponse(response);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async tsdbAuthRequest(params?: any) {
    const queryType = 'airthingsAuth';
    const tsdbRequestData = {
      queries: [{
        datasourceId: this.datasourceId,
        queryType,
        target: {
          params,
        },
      }],
    };

    try {
      const response = await getBackendSrv().datasourceRequest({
        url: '/api/tsdb/query',
        method: 'POST',
        data: tsdbRequestData
      });
      return this.handleTsdbResponse(response, queryType);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  handleTsdbResponse(response, queryType = 'airthingsApi') {
    if (response && (response.status >= 400 || response.status < 0)) {
      throw Error(response.statusText);
    }

    if (!response || !response.data || !response.data.results) {
      return [];
    }

    const responseData = response.data.results[queryType];
    if (responseData.error) {
      throw Error(responseData.error);
    }

    return responseData.meta;
  }

  proxyfy(func, funcName, funcScope) {
    if (!this.promises[funcName]) {
      this.promises[funcName] = {};
    }
    const promiseKeeper = this.promises[funcName];
    return callOnce(func, promiseKeeper, funcScope);
  }
}

/**
 * Wrap request to prevent multiple calls
 * with same params when waiting for result.
 */
function callOnce(func, promiseKeeper, funcScope): (...args: any[]) => any {
  return function() {
    var hash = getRequestHash(arguments);
    if (!promiseKeeper[hash]) {
      promiseKeeper[hash] = Promise.resolve(
        func.apply(funcScope, arguments)
        .then(result => {
          promiseKeeper[hash] = null;
          return result;
        })
      );
    }
    return promiseKeeper[hash];
  };
}

function getRequestHash(args) {
  const argsJson = JSON.stringify(args);
  return getHash(argsJson);
}

function getHash(srt: string) {
  var hash = 0, i, chr, len;
  if (srt.length !== 0) {
    for (i = 0, len = srt.length; i < len; i++) {
      chr   = srt.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
  }
  return hash;
}
