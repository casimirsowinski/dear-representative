import {states as allStates, officials} from './current';
import {oregon} from './oregon';

/** All jurisdictions present in the national import; Oregon listed first for defaults/tests. */
export const states = [oregon, ...allStates.filter(s => s.code !== 'OR')];
export const legislators = officials;
export {oregon};
