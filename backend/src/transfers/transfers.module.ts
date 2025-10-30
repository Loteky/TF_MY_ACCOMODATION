import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [ConfigModule],
  providers: [TransfersService],
  controllers: [TransfersController],
})
export class TransfersModule {}
