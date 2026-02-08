/**
 * K-UNIVERSAL User Feedback Collection API
 * Collects user feedback for continuous improvement
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { userId, email, category, message, rating, page } = body;

    // Validation
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // In production: Save to database
    const feedback = {
      id: `feedback-${Date.now()}`,
      userId: userId || 'anonymous',
      email: email || null,
      category: category || 'general',
      message,
      rating: rating || null,
      page: page || 'unknown',
      timestamp: new Date().toISOString(),
      status: 'new',
    };

    // Log feedback (in production: save to Supabase)
    console.log('User Feedback Received:', feedback);

    // In production: Send to Slack/Discord webhook for immediate notification
    if (category === 'bug' || rating <= 2) {
      console.log('🚨 Critical feedback - notifying team');
      // await notifyTeam(feedback);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('Failed to process feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // In production: Fetch recent feedback from database
  // For now, return mock data

  const mockFeedback = [
    {
      id: 'fb-1',
      category: 'feature_request',
      message: 'Would love to see multi-language support!',
      rating: 5,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'fb-2',
      category: 'bug',
      message: 'OCR failed on my passport (UK)',
      rating: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'fb-3',
      category: 'general',
      message: 'Amazing product! This solved my biggest pain point.',
      rating: 5,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  ];

  return NextResponse.json({
    feedback: mockFeedback,
    total: mockFeedback.length,
  });
}
