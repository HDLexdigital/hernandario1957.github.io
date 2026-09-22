import type { APIRoute } from 'astro';
import { RollbackWorker } from '../../../services/RollbackWorker';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const author = body.authorizedBy || 'Editorial-Admin (UI)';

    const worker = new RollbackWorker();
    const result = await worker.executeRemoteRollback(author);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
