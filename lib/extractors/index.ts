import { BehanceExtractor } from './behance';
import { DribbbleExtractor } from './dribbble';
import { Extractor } from './types';

// Design-focused extractors only
const extractors: Extractor[] = [new BehanceExtractor(), new DribbbleExtractor()];

export function getExtractor(url: string): Extractor | null {
  const specific = extractors.find(extractor => extractor.canHandle(url));
  return specific || null;
}

