import {
Body,
Controller,
HttpCode,
HttpStatus,
Post,
} from "@nestjs/common";

import { RegisterInstitutionDto } from "./register-institution.dto";
import { InstitutionsService } from "./institutions.service";

@Controller("institutions")
export class InstitutionsController {
constructor(
private readonly institutionsService: InstitutionsService,
) {}

@Post("register")
@HttpCode(HttpStatus.CREATED)
register(@Body() dto: RegisterInstitutionDto) {
return this.institutionsService.register(dto);
}
}
