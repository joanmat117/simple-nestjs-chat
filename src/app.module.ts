import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MessagesModule } from './messages/messages.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

@Module({
  imports: [MessagesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "frontend"),
      exclude: ['/api/*route']
    })
  ],
  controllers: [AppController],
})
export class AppModule { }
