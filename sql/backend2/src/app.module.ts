import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BoothModule } from './modules/booth/booth.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [PrismaModule, BoothModule, FavoriteModule, VendorModule, AdminModule],
})
export class AppModule {}
