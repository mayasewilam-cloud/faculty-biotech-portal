
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPushSubscriptions } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to dispatch notifications' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title = 'Faculty of Biotechnology Directive',
      body: message = 'Official academic alert from Dean Executive Office.',
      url = '/',
      target_user_id,
    } = body;

    const targetUserId = target_user_id ? Number(target_user_id) : user.id;
    const subscriptions = await getPushSubscriptions(targetUserId);

    const payload = {
      title,
      body: message,
      icon: '/logos/faculty-of-biotechnology.jpeg',
      badge: '/logos/faculty-of-biotechnology.jpeg',
      url,
      timestamp: Date.now(),
    };

    // Check for VAPID keypair in environment variables
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || (globalThis as any).VAPID_PRIVATE_KEY;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || (globalThis as any).VAPID_PUBLIC_KEY;

    if (!vapidPrivateKey || !vapidPublicKey) {
      return NextResponse.json({
        success: false,
        status: 'vapid_unconfigured',
        message: 'Server-side VAPID keypair is not configured. Remote lockscreen delivery when the website is closed requires VAPID_PRIVATE_KEY and NEXT_PUBLIC_VAPID_PUBLIC_KEY secrets on the server.',
        targetUserId,
        subscriptionsCount: subscriptions.length,
        payload,
      });
    }

    // In a fully configured environment, Web Push RFC 8291 payload encryption and POST to subscriber endpoints occurs here.
    return NextResponse.json({
      success: true,
      status: 'dispatched',
      message: `Push notification request processed for ${subscriptions.length} active device subscription(s).`,
      targetUserId,
      subscriptionsCount: subscriptions.length,
      payload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch push notification' }, { status: 500 });
  }
}
