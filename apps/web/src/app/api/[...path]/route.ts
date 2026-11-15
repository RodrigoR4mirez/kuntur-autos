import { proxyToApi } from '../../../lib/proxy.ts';

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, { params }: Context): Promise<Response> {
  const { path } = await params;
  return proxyToApi(request, '/' + path.join('/'));
}

export const GET = handle;
export const POST = handle;
export const dynamic = 'force-dynamic';
