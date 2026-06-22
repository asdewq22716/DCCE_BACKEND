import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import axios from 'axios';

@Injectable()
export class EFormService {
  private readonly baseUrl: string;
  private readonly axiosConfig: any = {};

  constructor(private configService: ConfigService) {
    let url = this.configService.get<string>('EFORM_API_URL') || 'https://eform-adaptme.dcce.go.th';
    
    // DNS bypass for Easypanel ENOTFOUND issue
    if (url.includes('eform-adaptme.dcce.go.th')) {
      url = url.replace('eform-adaptme.dcce.go.th', '167.179.250.18');
      this.axiosConfig = {
        headers: { 'Host': 'eform-adaptme.dcce.go.th' },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      };
    }
    this.baseUrl = url;
  }

  async testLogin(body: any) {
    try {
      const url = `${this.baseUrl}/api/auth/login`;
      const response = await axios.post(url, body, {
        ...this.axiosConfig,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAnswers() {
    try {
      // 1. Auto Login First
      const loginUrl = `${this.baseUrl}/api/auth/login`;
      const loginPayload = {
        username: 'admin',
        password: 'admin1234',
        loginType: 'api',
      };
      const loginResponse = await axios.post(loginUrl, loginPayload, {
        ...this.axiosConfig,
        headers: { 
          ...this.axiosConfig.headers,
          'Content-Type': 'application/json' 
        },
      });

      console.log("=== Login Response Data ===");
      console.log(JSON.stringify(loginResponse.data, null, 2));

      // ค้นหา Token จาก Response
      const token = loginResponse.data?.token || loginResponse.data?.data?.token;
      
      console.log("=== Extracted Token ===", token);

      if (!token) {
        throw new HttpException('Auto-login failed: Token not found in response', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 2. Fetch Answers
      const answersUrl = `${this.baseUrl}/api/answers/`;
      const answersResponse = await axios.get(answersUrl, {
        ...this.axiosConfig,
        headers: {
          ...this.axiosConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      });
      
      return answersResponse.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
