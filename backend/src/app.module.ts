import { Module } from '@nestjs/common';
import { MockModule } from './modules/mock/mock.module';

@Module({
  imports: [MockModule],
})
export class AppModule {}
