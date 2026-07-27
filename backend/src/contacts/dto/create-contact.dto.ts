import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  entreprise?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsDateString()
  dateJoined?: string;

  @IsOptional()
  @IsInt()
  score?: number;

  @IsOptional()
  @IsObject()
  dynamicValues?: Record<string, string>;
}
