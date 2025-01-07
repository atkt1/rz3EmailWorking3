import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {


   // Create Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key
    );

    // Get review ID from request
    const { reviewId } = await req.json();
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    console.log('Received request with reviewId:', reviewId);

    // Get review record with products
    const { data: review, error: reviewError } = await supabaseClient
      .from('reviews')
      .select('*, products(*)')
      .eq('id', reviewId)
      .single();

    console.log('Found review:', review);
    
    if (reviewError) throw reviewError;
    if (!review) throw new Error('Review not found');

    // Find available coupon/voucher
    let couponCode = null;
    
    // First check coupons
    const { data: coupon } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('giveaway', review.products.giveaway)
      .eq('status', 'Available')
      .eq('user_id', review.user_id)
      .limit(1)
      .single();

    if (coupon) {
      couponCode = coupon.coupon_code;
      console.log('Found coupon:', coupon);
    } else {
      // Check vouchers if no coupon found
      const { data: voucher } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('giveaway', review.products.giveaway)
        .eq('status', 'Available')
        .limit(1)
        .single();

      if (voucher) {
        couponCode = voucher.coupon_code;
        console.log('Found voucher:', voucher);
      }
    }

    
    if (!couponCode) {
      throw new Error('No available coupon/voucher found');
    }

    // First extract firstName from review data
  const firstName = review.first_name || 'Valued Customer'; // Fallback if first_name is null


    // Send email
  try {
  console.log('Attempting to send email to:', review.email_id);

  const emailResult = await resend.emails.send({
  from: 'ReviewZone <noreply@resend.dev>',
  to: review.email_id,
  subject: 'Your Review Reward',
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
    </head>
    <body style="margin: 0; padding: 0; background-color: #EBF5FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #EBF5FF;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation">
<!-- Logo -->
<tr>
  <td align="center" style="padding: 20px;">
    <div style="display: inline-flex; align-items: center; gap: 4px;">
      <!-- Star icon -->
      <span style="font-size: 29px; color: #2563eb; display: flex;">☆</span>
      <!-- ReviewZone text -->
      <span style="font-size: 28px; font-weight: bold; color: #2563eb;">Review<span style="color: #3b82f6">Zone</span></span>
    </div>
  </td>
</tr>


              <!-- Content -->
              <tr>
                <td style="background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #0f172a;">
                          Hi ${firstName},
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 16px; color: #334155; font-size: 16px;">
                        <p style="margin: 0;">Thank you for your review!</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 16px; color: #334155; font-size: 16px;">
                        <p style="margin: 0;">We really appreciate you taking the time to share your experience.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 16px; color: #334155; font-size: 16px;">
                        <p style="margin: 0;">Here's your reward:</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                        <span style="font-family: monospace; font-size: 24px; font-weight: 600; letter-spacing: 2px; color: #0f172a;">${couponCode}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px; color: #334155; font-size: 16px;">
                        <p style="margin: 0;">You can use this code to claim your reward through our platform.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center; color: #64748b; font-size: 13px;">
                  <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} ReviewZone. All rights reserved.</p>
                  <p style="margin: 0;">This is an automated message, please do not reply.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
});

    
  console.log('Email sent successfully:', emailResult);
} catch (emailError) {
  console.error('Failed to send email:', emailError);
  throw emailError;
}

    // Update coupon/voucher status
    if (coupon) {
      await supabaseClient
        .from('coupons')
        .update({
          status: 'Consumed',
          review_id: reviewId
        })
        .eq('coupon_code', couponCode);
    } else {
      await supabaseClient
        .from('vouchers')
        .update({
          status: 'Consumed',
          review_id: reviewId,
          user_id: review.user_id
        })
        .eq('coupon_code', couponCode);
    }

    // Update email status
    await supabaseClient
      .from('emails')
      .update({
        status: 'Sent',
        sent_at: new Date().toISOString(),
        coupon_code: couponCode
      })
      .eq('review_id', reviewId);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
         
        }
      }
    );
  } catch (error) {
    console.error('Error processing email:', error);

    // Update email status to Failed if we have the review ID
    if (req.reviewId) {
      await supabaseClient
        .from('emails')
        .update({
          status: 'Failed'
        })
        .eq('review_id', req.reviewId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        
        }
      }
    );
  }
})
