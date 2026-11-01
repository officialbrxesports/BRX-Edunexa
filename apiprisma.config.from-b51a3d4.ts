[33mb51a3d4[m[33m ([m[1;31morigin/cleanup/v3[m[33m)[m feat: add EduNexa login and Prisma setup
 apps/api/package.json                          |    6 [32m+[m
 apps/api/prisma.config.ts                      |   12 [32m+[m
 apps/api/prisma/schema.prisma                  |  480 [32m++++++[m
 apps/api/src/app.module.ts                     |    5 [32m+[m[31m-[m
 apps/api/src/main.ts                           |    5 [32m+[m[31m-[m
 apps/api/src/modules/auth/auth.controller.ts   |   37 [32m+[m
 apps/api/src/modules/auth/auth.module.ts       |   10 [32m+[m
 apps/api/src/modules/auth/auth.service.ts      |  101 [32m++[m
 apps/api/src/modules/auth/login.dto.ts         |   14 [32m+[m
 apps/api/src/prisma/prisma.module.ts           |    9 [32m+[m
 apps/api/src/prisma/prisma.service.ts          |   28 [32m+[m
 apps/web/src/app/globals.css                   |  282 [32m+++[m[31m-[m
 apps/web/src/app/login/page.tsx                |   76 [32m+[m
 apps/web/src/components/layout/site-header.tsx |   10 [32m+[m[31m-[m
 package-lock.json                              | 1940 [32m++++++++++++++++++++++[m[31m--[m
 15 files changed, 2815 insertions(+), 200 deletions(-)
