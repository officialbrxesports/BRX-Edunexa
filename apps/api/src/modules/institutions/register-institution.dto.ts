import { Transform } from "class-transformer";
import {
IsEmail,
IsIn,
IsObject,
IsString,
MaxLength,
MinLength,
} from "class-validator";

const categories = [
"SCHOOL",
"COLLEGE",
"UNIVERSITY",
"COACHING",
"INSTITUTE",
"OTHER",
];

export class RegisterInstitutionDto {
@IsIn(categories)
category!: string;

@IsString()
@MinLength(2)
@MaxLength(150)
institutionName!: string;

@IsString()
@MinLength(2)
@MaxLength(100)
fullName!: string;

@Transform(({ value }) =>
typeof value === "string" ? value.trim().toLowerCase() : value,
)
@IsEmail()
@MaxLength(254)
email!: string;

@IsString()
@MinLength(7)
@MaxLength(20)
phone!: string;

@IsString()
@MinLength(5)
@MaxLength(500)
address!: string;

@IsString()
@MinLength(8)
@MaxLength(128)
password!: string;

@Transform(({ value }) => {
if (typeof value !== "string") {
return value;
}

try {
  return JSON.parse(value);
} catch {
  return value;
}

})
@IsObject()
details!: Record<string, unknown>;
}
