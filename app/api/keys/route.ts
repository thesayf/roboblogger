import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import ApiKey, { generateApiKey } from '@/models/ApiKey';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// GET /api/keys - List all API keys for the current user
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const keys = await ApiKey.find({ owner: currentUser.mongoId })
      .select('-keyHash') // Never expose the hash
      .sort({ createdAt: -1 });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/keys - Generate a new API key
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if user already has too many keys (limit to 10)
    const existingCount = await ApiKey.countDocuments({ owner: currentUser.mongoId });
    if (existingCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of API keys reached (10). Please delete an existing key first.' },
        { status: 400 }
      );
    }

    // Generate the key
    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    // Save to database
    const apiKey = new ApiKey({
      keyHash,
      keyPrefix,
      owner: currentUser.mongoId,
      name: name.trim(),
      permissions: ['read'],
      rateLimit: 1000
    });

    await apiKey.save();

    // Return the raw key ONCE - it can never be retrieved again
    return NextResponse.json({
      key: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt
      },
      // This is the only time the raw key is returned!
      rawKey,
      message: 'API key created successfully. Copy this key now - it cannot be shown again.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/keys?id=<keyId> - Revoke/delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyId = request.nextUrl.searchParams.get('id');
    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find and delete the key (only if owned by current user)
    const result = await ApiKey.findOneAndDelete({
      _id: keyId,
      owner: currentUser.mongoId
    });

    if (!result) {
      return NextResponse.json(
        { error: 'API key not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
