import { AxiosInstance } from 'axios';

import AppService from 'frontend/services/app.service';
import { getAccessTokenFromStorage } from 'frontend/utils/storage-util';

export default class APIService extends AppService {
  apiClient: AxiosInstance;
  apiUrl: string;

  constructor() {
    super();
    this.apiUrl = `${this.appHost}/api`;
    this.apiClient = APIService.getAxiosInstance({
      baseURL: this.apiUrl,
    });
    // Add interceptor for Authorization header
    this.apiClient.interceptors.request.use((config) => {
      const accessToken = getAccessTokenFromStorage();
      if (accessToken?.token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${accessToken.token}`;
      }
      return config;
    });
  }
}
