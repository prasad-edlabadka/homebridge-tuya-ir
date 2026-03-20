import CryptoJS from 'crypto-js';
import { Logger } from 'homebridge';
import https from 'https';
import { URL } from 'url';
import { TuyaIRConfiguration } from '../model/TuyaIRConfiguration';
import { LoginHelper } from './LoginHelper';
import { cachedLookup, flushDnsCache } from './tuyaDnsCache';

// Reuse sockets across requests to reduce DNS/TLS churn.
const tuyaAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 30_000,
});

// Some @types/node versions don't expose `lookup` on https.RequestOptions,
// even though Node supports it at runtime. Patch the type locally.
type RequestOptionsWithLookup = https.RequestOptions & {
  lookup?: (hostname: string, options: any, cb: any) => void;
};

export class APIInvocationHelper {
  public static getSignedValuesForGetWithAccessToken(
    url: URL,
    config: TuyaIRConfiguration,
    timestamp: number,
    accessToken: string,
  ) {
    return this.calculateSign(url, config, 'GET', timestamp, true, accessToken);
  }

  public static getSignedValuesForGetWithoutAccessToken(
    url: URL,
    config: TuyaIRConfiguration,
    timestamp: number,
  ) {
    return this.calculateSign(url, config, 'GET', timestamp, false);
  }

  public static invokeTuyaIrApi(
    log: Logger,
    config: TuyaIRConfiguration,
    endpoint: string,
    method: string,
    body: object,
    callback,
  ) {
    log.debug(`Calling endpoint ${endpoint} with payload ${JSON.stringify(body)}`);

    const timestamp = new Date().getTime();
    const accessToken = LoginHelper.Instance(config, log).getAccessToken();

    const bodyForSigning = method === 'GET' ? '' : JSON.stringify(body);

    const signedParameters = this.calculateSign(
      new URL(endpoint),
      config,
      method,
      timestamp,
      true,
      accessToken,
      bodyForSigning,
    );

    const options: RequestOptionsWithLookup = {
      method,
      headers: {
        client_id: config.tuyaAPIClientId,
        sign: signedParameters.signKey,
        t: timestamp,
        access_token: accessToken,
        sign_method: 'HMAC-SHA256',
        'Content-Type': 'application/json',
      },
      agent: tuyaAgent,
      lookup: cachedLookup,
    };

    const req = https.request(endpoint, options, (incomingMsg) => {
      let responseBody = '';
      incomingMsg.on('data', (chunk) => {
        responseBody += chunk;
      });

      incomingMsg.on('end', () => {
        let jsonBody: any;
        try {
          jsonBody = responseBody ? JSON.parse(responseBody) : {};
        } catch (error) {
          jsonBody = { success: false, msg: `Unable to parse body because '${error}'` };
        }

        if (incomingMsg.statusCode != 200) {
          log.error(`Api call failed with response code ${incomingMsg.statusCode} for endpoint ${endpoint}`);
          const msg = jsonBody?.msg || `HTTP ${incomingMsg.statusCode}`;
          callback({ success: false, msg });
          return;
        }

        // Tuya returns success: false with error codes 1010/1011/1012 when
        // the access token is invalid or expired. Reactively trigger a
        // refresh so we don't wait for the (possibly dead) proactive timer.
        if (!jsonBody.success && this.isTokenError(jsonBody)) {
          log.warn(`Token invalid (code ${jsonBody.code}), triggering refresh...`);
          LoginHelper.Instance(config, log).refreshAccessToken().catch((err) => {
            log.error(`Reactive token refresh failed: ${err?.message || err}`);
          });
        }

        log.debug('API call successful.', responseBody);
        callback(jsonBody);
      });
    });

    req.on('error', (err: any) => {
      // Flush cached DNS on network errors so next request re-resolves.
      try {
        const host = new URL(endpoint).hostname;
        const code = err?.code;
        if (
          code === 'ETIMEDOUT' ||
          code === 'ECONNRESET' ||
          code === 'EPIPE' ||
          code === 'EHOSTUNREACH' ||
          code === 'ENETUNREACH' ||
          code === 'ECONNREFUSED'
        ) {
          flushDnsCache(host);
        }
      } catch {
        // ignore
      }

      const message = err?.message || err?.code || String(err) || 'Unknown error';
      log.error(message, err?.stack);
      callback({ success: false, msg: `Failed to invoke API '${message}'` });
    });

    if (method !== 'GET') {
      req.write(JSON.stringify(body));
    }

    req.end();
  }

  private static calculateSign(
    url: URL,
    config: TuyaIRConfiguration,
    httpMethod: string,
    timestamp: number,
    withAccessToken: boolean,
    accessToken = '',
    body = '',
  ) {
    const returnObject = { timestamp: timestamp, signKey: '' };
    const signedParameters = this.stringToSign(url.search, url.pathname, httpMethod, body);
    const signStr = signedParameters.signedUrl;

    const str = withAccessToken
      ? config.tuyaAPIClientId + accessToken + timestamp + signStr
      : config.tuyaAPIClientId + timestamp + signStr;

    returnObject.signKey = CryptoJS.HmacSHA256(str, config.tuyaAPISecret).toString().toUpperCase();
    return returnObject;
  }

  private static stringToSign(query, url, method, body = '') {
    const sha256 = CryptoJS.SHA256(body);
    return { signedUrl: method + '\n' + sha256 + '\n\n' + url + query, url: url + query };
  }

  /**
   * Tuya error codes that indicate an invalid/expired access token.
   * 1010 = token invalid, 1011 = token expired, 1012 = token does not exist.
   */
  private static readonly TOKEN_ERROR_CODES = new Set([1010, 1011, 1012]);

  private static isTokenError(body: any): boolean {
    return this.TOKEN_ERROR_CODES.has(body?.code);
  }
}
