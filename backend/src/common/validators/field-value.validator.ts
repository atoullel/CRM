import { BadRequestException } from '@nestjs/common';

export function isValidNumber(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(Number(value))
  );
}

export function isValidInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function isValidText(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidPhone(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const phone = value.trim();

  const digitsOnly = phone.replace(/\D/g, '');

  return (
    /^[+]?[\d\s().-]+$/.test(phone) &&
    digitsOnly.length >= 6 &&
    digitsOnly.length <= 15
  );
}

export function parseDate(value: string, fieldName = 'dateJoined'): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }

  return parsed;
}
