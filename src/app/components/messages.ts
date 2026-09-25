// Rotating reassurance shown in the quiz dock. Keyed by question index so the
// sequence feels composed rather than random, and cycles without repeating.

export const REASSURANCES: string[] = [
  'There are no right answers here — only honest ones.',
  'Go with the first instinct. The second one is usually the performance.',
  'Some options describe people you know. That\'s the point.',
  'You can\'t do this wrong. You can only do it as you.',
  'Every option is a real way of loving. None of them is the "good partner" answer.',
  'Later, some scenarios return wearing different clothes. Answer them fresh.',
  'Nobody is watching. This document belongs to you.',
  'Somewhere in the middle is a place too — the middle is allowed.',
  'The quiet preferences count as much as the loud ones.',
  'You are not being graded. You are being described.',
  'If two answers both feel true, that tension is data too.',
  'Half of these questions are just asking: what does care look like when it\'s your turn to receive it?',
  'A blueprint isn\'t a standard. It\'s a starting point for a conversation.',
  'The things you\'d want done for you — those answers matter most.',
  'It always depends on the day. We\'re after the center of gravity.',
  'Whatever you notice yourself avoiding — that\'s worth noticing.',
  'This is how you love as you are, not as you intend to be.',
  'Almost there. The honest ones are the ones that count.',
];

export function messageFor(index: number): string {
  return REASSURANCES[index % REASSURANCES.length];
}
