import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export class EmailService {
  static async createEmailRecord(data: {
    userId: string;
    productId: string;
    surveyId: string;
    reviewId: string;
  }) {
    try {
      // Create admin client
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: email, error } = await adminClient
        .from('emails')
        .insert({
          user_id: data.userId,
          product_id: data.productId,
          survey_id: data.surveyId,
          review_id: data.reviewId,
          status: 'Pending'
        })
        .select()
        .single();

      if (error) throw error;
      return email;
    } catch (error) {
      console.error('Error creating email record:', error);
      throw error;
    }
  }

// src/lib/services/emailService.ts

// src/lib/services/emailService.ts
static async triggerEmail(reviewId: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emailTrigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reviewId })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger email');
    }

    return true;
  } catch (error) {
    console.error('Error triggering email:', error);
    throw error;
  }
}



}
