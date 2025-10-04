import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.trim()) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Call backend API to store the email
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
        const response = await fetch(`${backendUrl}/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                source: 'landing_page',
                subscribed_at: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to subscribe');
        }

        const result = await response.json();

        return NextResponse.json({
            message: 'Successfully subscribed to newsletter',
            data: result
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

