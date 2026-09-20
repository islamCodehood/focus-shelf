import {authenticate,bridge,errorResponse,AppError} from '@/lib/server';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{if(!await authenticate())throw new AppError('ACCESS','Please sign in.',401);const {id}=await params;const data=await bridge('cover',{id}) as {base64:string;mime:string};return new Response(Buffer.from(data.base64,'base64'),{headers:{'Content-Type':data.mime,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});}catch(e){return errorResponse(e);}}
