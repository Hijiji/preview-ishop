import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY가 설정되지 않았습니다. 서버를 시작할 수 없습니다.',
      );
    }
    if (key.length !== 32) {
      throw new Error(
        `INVALID_KEY_LENGTH: 암호화 키는 정확히 32바이트(hex 기준 64자)여야 합니다. 현재: ${key.length}바이트`,
      );
    }
    this.encryptionKey = key;
  }

  /**
   * 평문을 암호화
   * @param plaintext
   * @returns
   */
  encrypt(plaintext: string): string {
    // IV(초기화 벡터) 생성
    const iv = crypto.randomBytes(this.ivLength);

    // IV를 이용해 cipher 생성
    const cipher = crypto.createCipheriv(
      this.algorithm,
      crypto.scryptSync(this.encryptionKey, 'salt', 32),
      iv,
    );

    // 평문 암호화
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // IV + 암호화된 데이터를 함께 반환
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 암호화된 텍스트를 복호화
   * @param encryptedText
   * @returns
   */
  decrypt(encryptedText: string): string {
    // IV와 암호화된 데이터 분리
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    // scrypt를 사용한 키 파생 (encrypt와 일관성 유지)
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    // IV를 이용해 decipher 생성
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    // 암호화된 데이터 복호화
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
