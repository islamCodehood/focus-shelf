export const STATES=['Main','Side','Parking','Paused','Done','Dropped'] as const;
export const TYPES=['Book','Course','Article','Video','Other'] as const;
export const UNITS=['Pages','Chapters','Lessons','Minutes','Hours','Percent','Custom'] as const;
export type State=typeof STATES[number];
export interface Item {id:string;title:string;type:typeof TYPES[number];coverFileId:string;resourceUrl:string;state:State;unit:typeof UNITS[number];customUnit:string;current:number;total:number|null;why:string;doneDefinition:string;nextStep:string;queuePosition:number;addedAt:string;startedAt:string;updatedAt:string;finishedAt:string;version:number;}
export interface LearningEvent {id:string;requestId:string;itemId:string;kind:string;at:string;delta:number;unit:string;fromState:string;toState:string;payload:Item|Review;}
export interface Review {weekStart:string;learned:string;adjust:string;nextStep:string;updatedAt:string;version:number;}
export interface Snapshot {items:Item[];events:LearningEvent[];reviews:Review[];timeZone:string;}
