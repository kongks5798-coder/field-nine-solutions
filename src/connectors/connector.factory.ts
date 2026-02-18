/**
 * Field Nine: 커넥터 팩토리
 * 
 * 의존성 주입을 통한 런타임 커넥터 선택
 */
// import { Injectable, NotImplementedException } from '@nestjs/common';
import { AdConnector } from '../core/interfaces/ad-connector.interface';
import { AdPlatform } from '../core/enums/ad-platform.enum';
import { MetaConnector } from './meta/meta.connector';
import { GoogleConnector } from './google/google.connector';
// import { NaverConnector } from './naver/naver.connector';
import { Cafe24Connector } from './cafe24/cafe24.connector';

// @Injectable()
export class ConnectorFactory {
  constructor(
    private readonly metaConnector: MetaConnector,
    private readonly googleConnector: GoogleConnector,
    private readonly cafe24Connector: Cafe24Connector,
  ) {}

  getConnector(platform: AdPlatform): AdConnector {
    switch (platform) {
      case AdPlatform.META:
        return this.metaConnector;
      case AdPlatform.GOOGLE:
        return this.googleConnector;
      case AdPlatform.CAFE24:
        return this.cafe24Connector;
      default:
        throw new Error(`Platform ${platform} is not supported.`);
    }
  }
}
