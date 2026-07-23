import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { AppConfigService } from './app-config.service.js';
import { validateEnvironment } from './app-config.schema.js';

const workspaceEnvironmentFile = fileURLToPath(
  new URL('../../../../.env', import.meta.url),
);

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      envFilePath: workspaceEnvironmentFile,
      expandVariables: true,
      validate: validateEnvironment,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
