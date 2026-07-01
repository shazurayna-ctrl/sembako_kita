// ============================================
// APP.MODULE.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Import semua module
// 2. Konfigurasi global
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HttpModule } from '@nestjs/axios';

// AI Services
import { QwenService } from './ai/qwen.service';
import { StressBarometerService } from './ai/stress-barometer.service';
import { DisasterPredictionService } from './ai/disaster-prediction.service';

// Payments
import { PaymentVerificationService } from './payments/verification.service';

// Mesh
import { GossipProtocolService } from './mesh/gossip-protocol.service';

// Ledger
import { BlockchainValidatorService } from './ledger/blockchain-validator.service';

// Token
import { SembakoTokenService } from './token/sembako-token.service';

// Compression
import { BinaryPackerService } from './compression/binary-packer.service';

// Security
import { ZeroTrustGuard } from './security/zero-trust.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    // AI Services
    QwenService,
    StressBarometerService,
    DisasterPredictionService,

    // Payments
    PaymentVerificationService,

    // Mesh
    GossipProtocolService,

    // Ledger
    BlockchainValidatorService,

    // Token
    SembakoTokenService,

    // Compression
    BinaryPackerService,

    // Security
    ZeroTrustGuard,
  ],
  exports: [
    QwenService,
    StressBarometerService,
    DisasterPredictionService,
    PaymentVerificationService,
    GossipProtocolService,
    BlockchainValidatorService,
    SembakoTokenService,
    BinaryPackerService,
    ZeroTrustGuard,
  ],
})
export class AppModule {}
