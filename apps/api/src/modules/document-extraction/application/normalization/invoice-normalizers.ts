import { Injectable } from '@nestjs/common';
import {
  normalizeAmountMinor,
  normalizeCzechDate,
} from '../result-normalization.service.js';

export class CzechDateNormalizer {
  public normalize(value: string): string | null {
    return normalizeCzechDate(value);
  }
}
export class MoneyNormalizer {
  public normalize(value: string): number | null {
    return normalizeAmountMinor(value);
  }
}
export class CurrencyNormalizer {
  public normalize(value: string): string | null {
    if (/\bEUR\b|€/i.test(value)) return 'EUR';
    if (/\bCZK\b|Kč/i.test(value)) return 'CZK';
    return null;
  }
}
export class CompanyIdNormalizer {
  public normalize(value: string): string | null {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const sum = digits
      .slice(0, 7)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (8 - index), 0);
    const check = (11 - (sum % 11)) % 10;
    return check === Number(digits[7]) ? digits : null;
  }
}
export class VatIdNormalizer {
  public normalize(value: string): string | null {
    const normalized = value.replace(/\s/g, '').toUpperCase();
    return /^CZ\d{8,10}$/.test(normalized) ? normalized : null;
  }
}
export class BankAccountNormalizer {
  public normalize(value: string): string | null {
    const normalized = value.replace(/\s/g, '');
    return /^(?:\d{0,6}-)?\d{2,10}\/\d{4}$/.test(normalized)
      ? normalized
      : null;
  }
}
export class IbanNormalizer {
  public normalize(value: string): string | null {
    const normalized = value.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) return null;
    const rearranged = `${normalized.slice(4)}${normalized.slice(0, 4)}`;
    let remainder = 0;
    for (const character of rearranged) {
      const digits = /\d/.test(character)
        ? character
        : String(character.charCodeAt(0) - 55);
      for (const digit of digits)
        remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder === 1 ? normalized : null;
  }
}
export class VariableSymbolNormalizer {
  public normalize(value: string): string | null {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 1 && digits.length <= 10 ? digits : null;
  }
}
export class InvoiceNumberNormalizer {
  public normalize(value: string): string | null {
    const normalized = value
      .trim()
      .replace(/^[:#\s-]+/, '')
      .slice(0, 100);
    return normalized && /[\dA-Z]/i.test(normalized) ? normalized : null;
  }
}

@Injectable()
export class InvoiceNormalizationService {
  public readonly date = new CzechDateNormalizer();
  public readonly money = new MoneyNormalizer();
  public readonly currency = new CurrencyNormalizer();
  public readonly companyId = new CompanyIdNormalizer();
  public readonly vatId = new VatIdNormalizer();
  public readonly bankAccount = new BankAccountNormalizer();
  public readonly iban = new IbanNormalizer();
  public readonly variableSymbol = new VariableSymbolNormalizer();
  public readonly invoiceNumber = new InvoiceNumberNormalizer();
}
