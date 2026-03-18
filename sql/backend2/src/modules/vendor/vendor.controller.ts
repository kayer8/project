import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VendorService } from './vendor.service';
import { StartSessionDto } from './dto/start-session.dto';
import { LocationReportDto } from './dto/location-report.dto';
import { SessionsQueryDto } from './dto/sessions-query.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@ApiTags('Vendor')
@Controller('api/vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('session/start')
  startSession(@Req() req: Request, @Body() dto: StartSessionDto) {
    const vendorId = this.getVendorId(req);
    return this.vendorService.startSession(vendorId, {
      boothId: dto.booth_id,
      lat: dto.lat,
      lng: dto.lng,
      address: dto.address,
    });
  }

  @Post('location/report')
  reportLocation(@Body() dto: LocationReportDto) {
    return this.vendorService.reportLocation({
      sessionId: dto.session_id,
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
    });
  }

  @Post('session/:id/pause')
  pause(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.pauseSession(id);
  }

  @Post('session/:id/end')
  end(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.endSession(id);
  }

  @Get('sessions')
  list(@Req() req: Request, @Query() query: SessionsQueryDto) {
    const vendorId = this.getVendorId(req);
    return this.vendorService.listSessions(vendorId, {
      dateRange: query.date_range,
    });
  }

  private getVendorId(req: Request) {
    const headerValue = req.headers['x-vendor-id'] ?? req.headers['x-vendorid'];
    const fallback = (req.query.vendor_id as string) ?? (req.body?.vendor_id as string);
    const raw = (headerValue as string) ?? fallback;
    const vendorId = raw ? Number(raw) : NaN;
    if (!vendorId || Number.isNaN(vendorId)) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Vendor id is required via x-vendor-id header or vendor_id param',
      );
    }
    return vendorId;
  }
}
