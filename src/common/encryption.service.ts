import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from './winston-logger';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new WinstonLogger(EncryptionService.name);
  private readonly encryptionKey: string;
  private readonly searchKey: string; // 검색용 HMAC 키 (암호화 키와 분리)
  private readonly globalPepper: string; // 글로벌 페퍼: 레인보우 테이블 방어 + 검색 가능성 유지
  private readonly algorithm: string;
  private readonly ivLength: number;
  private readonly scryptSalt: string;
  private readonly hmacAlgorithm: string;

  constructor(private readonly configService: ConfigService) {
    const encKey = this.configService.get<string>('ENCRYPTION_KEY');
    const searchKey = this.configService.get<string>('SEARCH_SECRET_KEY');
    const pepper = this.configService.get<string>('GLOBAL_PEPPER');
    const algorithm = this.configService.get<string>(
      'ENCRYPTION_ALGORITHM',
      'aes-256-cbc',
    );
    const ivLength = Number(
      this.configService.get<number>('ENCRYPTION_IV_LENGTH', 16),
    );
    const scryptSalt = this.configService.get<string>(
      'ENCRYPTION_SCRYPT_SALT',
      'salt',
    );
    const hmacAlgorithm = this.configService.get<string>(
      'ENCRYPTION_HMAC_ALGORITHM',
      'sha256',
    );

    if (!encKey || encKey.length !== 32) {
      throw new Error(
        'INVALID_ENCRYPTION_KEY: 암호화 키는 32바이트(hex)여야 합니다.',
      );
    }
    if (!searchKey || searchKey.length < 32) {
      this.logger.error(
        'Invalid search key configuration',
        'EncryptionService',
        {
          keyLength: searchKey?.length,
          requiredLength: 32,
        },
      );
      throw new Error(
        'INVALID_SEARCH_KEY: 검색 키는 최소 32바이트여야 합니다.',
      );
    }
    if (!pepper || pepper.length < 16) {
      this.logger.error(
        'Invalid global pepper configuration',
        'EncryptionService',
        {
          pepperLength: pepper?.length,
          requiredLength: 16,
        },
      );
      throw new Error(
        'INVALID_PEPPER: 글로벌 페퍼는 최소 16바이트여야 합니다.',
      );
    }

    this.encryptionKey = encKey;
    this.searchKey = searchKey;
    this.globalPepper = pepper;
    this.algorithm = algorithm;
    this.ivLength = ivLength;
    this.scryptSalt = scryptSalt;
    this.hmacAlgorithm = hmacAlgorithm;
  }

  /**
   * 평문을 AES-256-CBC로 암호화
   * @param plaintext
   * @returns
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      crypto.scryptSync(this.encryptionKey, this.scryptSalt, 32),
      iv,
    );
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 암호문 복호화
   * @param encryptedText
   * @returns
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.encryptionKey, this.scryptSalt, 32);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Blind Index 생성: HMAC-SHA256 + 글로벌 페퍼
   * - 검색 가능성을 유지하면서 레인보우 테이블 방어
   * - 행별 랜덤 솔트 대신 글로벌 페퍼로 보안 강화 (패턴 분석 방지)
   * @param data
   * @returns HMAC 해시 (hex)
   */
  generateBlindIndex(data: string): string {
    // 글로벌 페퍼 + 데이터 조합으로 HMAC 생성
    // 검색 키와 페퍼를 분리하여 키 노출 시에도 패턴 유추 어려움
    const combined = this.globalPepper + data;
    return crypto
      .createHmac(this.hmacAlgorithm, this.searchKey)
      .update(combined)
      .digest('hex');
  }

  /**
   * 부분 해시 생성
   * - 전체 해시보다 유연한 검색 지원
   * @param data
   * @param lastDigits
   * @returns 부분 데이터의 Blind Index
   */
  generatePartialBlindIndex(data: string, lastDigits: number): string {
    const partial = data.slice(-lastDigits);
    return this.generateBlindIndex(partial);
  }
}
