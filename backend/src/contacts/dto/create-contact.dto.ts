import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  IsPhoneNumber,
  Min,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsOptional()
  @IsString()
  entreprise?: string;

  @IsOptional()
  @IsPhoneNumber(undefined)
  telephone?: string;

  @IsOptional()
  @IsDateString()
  dateJoined?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsObject()
  dynamicValues?: Record<string, string>;
}
