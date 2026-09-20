import {cookies} from 'next/headers';
import {createHmac,createHash,timingSafeEqual,randomUUID} from 'node:crypto';
export class AppError extends Error {constructor(public code:string,message:string,public status=400){super(message);}}
export function configured(){return ['APPS_SCRIPT_URL','APPS_SCRIPT_SECRET','APP_ACCESS_HASH','SESSION_SECRET'].every(k=>Boolean(process.env[k]));}
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new AppError('NOT_CONFIGURED','The app needs its private connection settings.',503);return value;}
function eq(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function checkAccess(phrase:string){const hash=process.env.APP_ACCESS_HASH;return Boolean(hash&&eq(createHash('sha256').update(phrase).digest('hex'),hash));}
export async function authenticate(){const value=(await cookies()).get('focus_session')?.value;if(!value)return false;const [body,sig]=value.split('.');if(!body||!sig)return false;const expected=createHmac('sha256',secret()).update(body).digest('base64url');if(!eq(sig,expected))return false;try{const data=JSON.parse(Buffer.from(body,'base64url').toString());return data.exp>Date.now()&&data.aud==='focus-shelf';}catch{return false;}}
export async function createSession(){const body=Buffer.from(JSON.stringify({exp:Date.now()+7*86400000,aud:'focus-shelf',nonce:randomUUID()})).toString('base64url');const signature=createHmac('sha256',secret()).update(body).digest('base64url');(await cookies()).set('focus_session',body+'.'+signature,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*86400});}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');const expected=process.env.APP_ORIGIN||new URL(request.url).origin;if(!origin||origin!==expected)throw new AppError('ORIGIN','Please reload the app and try again.',403);}
export async function bridge(action:string,payload:unknown={},requestId:string=randomUUID()):Promise<unknown>{
 const url=process.env.APPS_SCRIPT_URL,key=process.env.APPS_SCRIPT_SECRET;
 if(!url||!key)throw new AppError('NOT_CONFIGURED','Google Sheets is not connected yet.',503);
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url))throw new AppError('CONFIG','The backend deployment URL is invalid.',503);
 const body=JSON.stringify({action,payload,requestId,at:Date.now()});const signature=createHmac('sha256',key).update(body).digest('hex');
 let result:Response;try{result=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body,signature}),redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(25000)});}catch{throw new AppError('CONNECTION','Could not reach Google Sheets. Retry with the same action.',503);}
 let data;try{data=await result.json();}catch{throw new AppError('BACKEND','The Google connection needs attention.',502);}
 if(!result.ok||!data.ok)throw new AppError(data.code||'BACKEND',data.message||'Could not save your change.',data.code==='CONFLICT'||data.code==='SLOT_FULL'?409:502);
 return data.data;
}
export function errorResponse(error:unknown){const e=error instanceof AppError?error:new AppError('INTERNAL','Something went wrong. Please try again.',500);return Response.json({error:e.message,code:e.code},{status:e.status,headers:{'Cache-Control':'no-store'}});}
