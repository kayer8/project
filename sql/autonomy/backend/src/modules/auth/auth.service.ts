import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { HouseService } from '../house/house.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { WechatRegisterDto } from './dto/wechat-register.dto';
import { WechatPhoneSyncDto } from './dto/wechat-phone-sync.dto';
import { SubmitRegistrationRequestDto } from './dto/submit-registration-request.dto';
import { WechatService } from './wechat.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly wechatService: WechatService,
    private readonly userService: UserService,
    private readonly houseService: HouseService,
  ) {}

  async loginWithWeChat(dto: WechatLoginDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    const user = await this.userService.findByWechatOpenid(session.openid);

    if (!user) {
      return {
        needRegister: true,
        accessToken: null,
        user: null,
      };
    }

    const hydratedUser =
      dto.nickname || dto.avatarUrl
        ? await this.userService.updateWeChatProfile(user.id, {
            nickname: dto.nickname,
            avatarUrl: dto.avatarUrl,
          })
        : user;

    return {
      needRegister: !hydratedUser.mobile,
      accessToken: hydratedUser.mobile
        ? this.signUserToken(hydratedUser.id, hydratedUser.wechatOpenid)
        : null,
      user: this.mapAuthUser(hydratedUser),
    };
  }

  async syncPhoneWithWeChat(dto: WechatPhoneSyncDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    const phoneInfo = await this.wechatService.getPhoneNumber(dto.phoneCode);
    const mobile = phoneInfo.purePhoneNumber;
    const archiveRecords = await this.prisma.residentArchive.findMany({
      where: {
        mobile,
        status: 'ACTIVE',
      },
      include: {
        house: {
          include: {
            householdGroups: {
              where: {
                status: 'ACTIVE',
              },
              orderBy: {
                startedAt: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let user = await this.resolveWeChatUser({
      openid: session.openid,
      unionid: session.unionid,
      mobile,
      realName: archiveRecords[0]?.realName ?? null,
    });

    if (archiveRecords.length > 0) {
      await this.syncArchivesToUser(user.id, archiveRecords);
      user = await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });

      return {
        matched: true,
        needRegistrationRequest: false,
        message: '您的号码已在物业留存数据已同步',
        accessToken: this.signUserToken(user.id, user.wechatOpenid),
        user: this.mapAuthUser(user),
      };
    }

    return {
      matched: false,
      needRegistrationRequest: true,
      message: '后台未检测到该手机号，请补充楼栋信息后提交',
      accessToken: this.signUserToken(user.id, user.wechatOpenid),
      user: this.mapAuthUser(user),
      mobile,
    };
  }

  async registerWithWeChat(dto: WechatRegisterDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    let user = await this.userService.findByWechatOpenid(session.openid);

    if (!user) {
      user = await this.userService.createWeChatUser({
        wechatOpenid: session.openid,
        wechatUnionid: session.unionid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        mobile: dto.mobile,
      });
    } else {
      user = await this.userService.updateWeChatProfile(user.id, {
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        mobile: dto.mobile,
      });
    }

    return {
      needRegister: false,
      accessToken: this.signUserToken(user.id, user.wechatOpenid),
      user: this.mapAuthUser(user),
    };
  }

  async submitRegistrationRequest(userId: string, dto: SubmitRegistrationRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
      },
    });

    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!user.mobile) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Mobile number is required before submitting registration request',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.houseService.ensureBuildingExists(dto.buildingId);

    if (dto.houseId) {
      const house = await this.prisma.house.findUnique({
        where: { id: dto.houseId },
        select: {
          id: true,
          buildingId: true,
        },
      });

      if (!house || house.buildingId !== dto.buildingId) {
        throw new BusinessException(
          AppErrorCode.HOUSE_NOT_FOUND,
          'House not found',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const pendingRequest = await this.prisma.registrationRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    const request = pendingRequest
      ? await this.prisma.registrationRequest.update({
          where: {
            id: pendingRequest.id,
          },
          data: {
            mobile: user.mobile,
            buildingId: dto.buildingId,
            houseId: dto.houseId ?? null,
          },
          include: {
            building: true,
            house: true,
          },
        })
      : await this.prisma.registrationRequest.create({
          data: {
            userId,
            mobile: user.mobile,
            buildingId: dto.buildingId,
            houseId: dto.houseId ?? null,
            status: 'PENDING',
          },
          include: {
            building: true,
            house: true,
          },
        });

    return {
      submitted: true,
      residentStatus: 'UNVERIFIED',
      latestRegistrationRequest: {
        id: request.id,
        mobile: request.mobile,
        status: request.status,
        buildingId: request.buildingId,
        buildingName: request.building.buildingName,
        houseId: request.houseId,
        houseDisplayName: request.house?.displayName ?? null,
        reviewNote: request.reviewNote,
        submittedAt: request.submittedAt,
      },
    };
  }

  listRegisterBuildings() {
    return this.houseService.listBuildings();
  }

  listRegisterHouses(buildingId: string) {
    return this.houseService.listRegistrationHouses(buildingId);
  }

  private async resolveWeChatUser(params: {
    openid: string;
    unionid?: string;
    mobile: string;
    realName?: string | null;
  }) {
    const userByOpenid = await this.userService.findByWechatOpenid(params.openid);
    const userByMobile = await this.userService.findByMobile(params.mobile);

    if (userByOpenid && userByMobile && userByOpenid.id !== userByMobile.id) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        '该手机号已绑定其他微信账号',
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetUser = userByOpenid ?? userByMobile;

    if (!targetUser) {
      return this.userService.createWeChatUser({
        wechatOpenid: params.openid,
        wechatUnionid: params.unionid,
        nickname: '微信用户',
        mobile: params.mobile,
        realName: params.realName ?? undefined,
      });
    }

    return this.userService.updateWeChatProfile(targetUser.id, {
      wechatOpenid: params.openid,
      wechatUnionid: params.unionid ?? null,
      mobile: params.mobile,
      ...(targetUser.realName ? {} : { realName: params.realName ?? undefined }),
    });
  }

  private async syncArchivesToUser(userId: string, archives: Array<any>) {
    await this.prisma.$transaction(async (tx) => {
      for (const archive of archives) {
        if (archive.houseId) {
          const householdGroup =
            archive.house?.householdGroups?.[0] ??
            (await tx.householdGroup.create({
              data: {
                houseId: archive.houseId,
                groupType: 'OWNER_HOUSEHOLD',
                status: 'ACTIVE',
                remark: '自动同步留存档案默认住户组',
              },
            }));

          const desiredRelationType = archive.relationType ?? 'MAIN_OWNER';
          const wantsPrimaryRole =
            desiredRelationType === 'MAIN_OWNER' || desiredRelationType === 'MAIN_TENANT';
          const existingPrimary = wantsPrimaryRole
            ? await tx.houseMemberRelation.findFirst({
                where: {
                  houseId: archive.houseId,
                  userId: {
                    not: userId,
                  },
                  isPrimaryRole: true,
                  status: 'ACTIVE',
                },
                select: {
                  id: true,
                },
              })
            : null;
          const existingRelation = await tx.houseMemberRelation.findFirst({
            where: {
              houseId: archive.houseId,
              userId,
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
            },
          });
          const relationPayload = {
            householdGroupId: householdGroup.id,
            relationType: desiredRelationType as any,
            relationLabel: archive.relationLabel ?? null,
            isPrimaryRole: wantsPrimaryRole && !existingPrimary,
            canViewBill: true,
            canPayBill: true,
            canActAsAgent: wantsPrimaryRole,
            canJoinConsultation: true,
            canBeVoteDelegate: wantsPrimaryRole,
            status: 'ACTIVE' as any,
            effectiveAt: new Date(),
            expiredAt: null,
          };

          if (existingRelation) {
            await tx.houseMemberRelation.update({
              where: {
                id: existingRelation.id,
              },
              data: relationPayload,
            });
          } else {
            await tx.houseMemberRelation.create({
              data: {
                houseId: archive.houseId,
                userId,
                ...relationPayload,
              },
            });
          }
        }

        await tx.residentArchive.update({
          where: {
            id: archive.id,
          },
          data: {
            status: 'SYNCED',
            matchedUserId: userId,
            matchedAt: new Date(),
          },
        });
      }
    });
  }

  private signUserToken(userId: string, openid: string) {
    return this.jwtService.sign({ userId, openid });
  }

  private mapAuthUser(user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    mobile: string | null;
    realName?: string | null;
  }) {
    return {
      id: user.id,
      nickname: user.nickname ?? '未命名用户',
      avatarUrl: user.avatarUrl ?? null,
      mobile: user.mobile ?? null,
      realName: user.realName ?? null,
    };
  }
}
