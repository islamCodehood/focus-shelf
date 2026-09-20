import {cookies} from 'next/headers';
import {authenticate,checkAccess,checkOrigin,configured,createSession,errorResponse,AppError} from '@/lib/server';
export const runtime='nodejs';
export async function GET(){try{return Response.json({configured:configured(),authenticated:configured()?await authenticate():false},{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{checkOrigin(request);if(!configured())throw new AppError('NOT_CONFIGURED','Connection setup is not complete.',503);const {phrase}=await request.json();if(typeof phrase!=='string'||phrase.length>512||!checkAccess(phrase))throw new AppError('ACCESS','That access phrase is not correct.',401);await createSession();return Response.json({ok:true});}catch(e){return errorResponse(e);}}
export async function DELETE(request:Request){try{checkOrigin(request);(await cookies()).delete('focus_session');return Response.json({ok:true});}catch(e){return errorResponse(e);}}
