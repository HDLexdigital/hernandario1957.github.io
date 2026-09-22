import type { APIRoute } from 'astro';
import { CloudSyncService } from '../../../services/cloud/CloudSyncService';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const syncService = new CloudSyncService();
    const result = await syncService.syncCurrentRelease();
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
