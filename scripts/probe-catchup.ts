import { readFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { computeOrder, computeCatchUpOrder } from '../src/domain/order';
import { QUESTIONS } from '../src/domain/questions';

const parsed = importSessionJson(readFileSync('blueprint-session-alec NEW.json', 'utf8'));
const seed = parsed.orderSeed ?? 0;
const answeredIds = Object.keys(parsed.answers);

const full = computeOrder(seed);
const catchUp = computeCatchUpOrder(seed, answeredIds);
const answeredSet = new Set(answeredIds);

const freshPile = catchUp.filter((id) => !answeredSet.has(id));
const oldPile = catchUp.filter((id) => answeredSet.has(id));
console.log('bank size:', QUESTIONS.length, '| answered:', answeredSet.length ?? answeredIds.length);
console.log('fresh pile first?', catchUp.slice(0, freshPile.length).every((id) => !answeredSet.has(id)));
console.log('fresh pile size:', freshPile.length, '(expect 18) · all wave-5?', freshPile.every((id) => id >= 'q123'));
// Answered questions keep the original seed's RELATIVE order:
const fullAnswered = full.filter((id) => answeredSet.has(id));
const sameRelative = JSON.stringify(fullAnswered) === JSON.stringify(oldPile);
console.log('answered keep original relative order?', sameRelative);
// First-unanswered walk:
const firstUn = catchUp.findIndex((id) => !answeredSet.has(id));
console.log('resume lands at index', firstUn, '→ first question is fresh?', firstUn === 0);
// Normal mid-run pause must NOT be flagged: answered form a prefix of full order?
const prefix = full.slice(0, answeredIds.length).every((id) => answeredSet.has(id));
console.log('(real session is NOT a prefix of new order — catch-up correctly indicated:', !prefix + ')');
