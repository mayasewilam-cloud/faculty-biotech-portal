
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { savePushSubscription, getPushSubscriptions, removePushSubscription } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await getPushSubscriptions(user.id);
    return NextResponse.json({
      subscribed: subs.length > 0,
      count: subs.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to check subscription' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await savePushSubscription(user.id, subscription);
    return NextResponse.json({ success: true, message: 'Push subscription registered successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to unsubscribe' }, { status: 500 });
  }
}
