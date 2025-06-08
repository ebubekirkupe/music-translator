import { translate } from 'google-translate-api-x';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

export class TranslationService {
  private cache: TranslationCache = {};
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  private createCacheKey(text: string, targetLanguage: string): string {
    return `${text.toLowerCase().trim()}_${targetLanguage}`;
  }

  private getFromCache(text: string, targetLanguage: string): string | null {
    const key = this.createCacheKey(text, targetLanguage);
    const cached = this.cache[key];
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.translation;
    }
    
    return null;
  }

  private saveToCache(text: string, translation: string, targetLanguage: string): void {
    const key = this.createCacheKey(text, targetLanguage);
    this.cache[key] = {
      translation,
      timestamp: Date.now()
    };
  }

  private getLanguageCode(language: string): string {
    const languageMap: { [key: string]: string } = {
      'Turkish': 'tr',
      'English': 'en',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Chinese': 'zh',
      'Arabic': 'ar',
      'Hindi': 'hi'
    };
    
    return languageMap[language] || 'tr';
  }

  async translateLine(
    line: string, 
    targetLanguage: string = 'Turkish'
  ): Promise<string> {
    try {
      // Check cache first
      const cached = this.getFromCache(line, targetLanguage);
      if (cached) {
        return cached;
      }

      const langCode = this.getLanguageCode(targetLanguage);
      const result = await translate(line, { to: langCode });
      const translation = result.text;
      
      // Save to cache
      this.saveToCache(line, translation, targetLanguage);
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return line; // Return original if translation fails
    }
  }

  async translateBatch(
    lines: string[], 
    targetLanguage: string = 'Turkish'
  ): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    
    for (const line of lines) {
      const translation = await this.translateLine(line, targetLanguage);
      translations.set(line, translation);
    }

    return translations;
  }
}