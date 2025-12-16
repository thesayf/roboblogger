import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }
    
    const adminPassword = process.env.BLOG_ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('BLOG_ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }
    
    // Simple password comparison
    const isValid = password === adminPassword;
    
    return NextResponse.json({
      success: isValid,
      ...(isValid ? {} : { error: 'Invalid password' })
    });
    
  } catch (error) {
    console.error('Admin password verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}