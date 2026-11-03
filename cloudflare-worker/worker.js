// Helper function to decode Quoted-Printable email content
function decodeQuotedPrintable(str) {
  return str
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/=\r?\n/g, '');
}

export default {
  async email(message, env, ctx) {
    try {
      // 1. Extract the Merchant API Key from the "To" address
      // e.g., "123e4567-e89b-12d3@mymobpay.tech" -> "123e4567-e89b-12d3"
      const toAddress = message.to;
      let apiKey = toAddress.split('@')[0];

      // Centralized platform payments address maps to platform/admin API key
      if (apiKey === 'payments') {
        apiKey = '677d9312-a53f-4b96-815f-53e0eee1b292';
      }

      if (!apiKey || apiKey.length < 10) {
        console.log(`ℹ️ Ignored email to non-API key address: ${toAddress}`);
        return;
      }

      // 2. Read the raw email stream body
      const reader = message.raw.getReader();
      let chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const rawMime = new TextDecoder().decode(
        Uint8Array.from(chunks.flatMap(c => [...c]))
      );

      // 3. Decode and Clean the raw email body
      let decoded = decodeQuotedPrintable(rawMime);

      // CRITICAL: Strip MIME routing headers (Received:, DKIM-Signature:, From:, To:, etc.)
      // The actual message body starts after the first blank line (\r\n\r\n or \n\n)
      const headerBodySplit = decoded.indexOf('\r\n\r\n');
      const headerBodySplitLF = decoded.indexOf('\n\n');
      
      let messageBody = decoded;
      if (headerBodySplit !== -1) {
        messageBody = decoded.substring(headerBodySplit + 4); // skip past \r\n\r\n
      } else if (headerBodySplitLF !== -1) {
        messageBody = decoded.substring(headerBodySplitLF + 2); // skip past \n\n
      }

      // For multipart MIME (Content-Type: multipart/...), extract text parts between boundaries
      const boundaryMatch = decoded.match(/boundary="?([^"\r\n;]+)"?/i);
      if (boundaryMatch) {
        const boundary = '--' + boundaryMatch[1];
        const parts = messageBody.split(boundary);
        // Find the first text/plain part
        const textPart = parts.find(p =>
          p.toLowerCase().includes('content-type: text/plain') ||
          p.toLowerCase().includes('content-type: text/html')
        );
        if (textPart) {
          // Strip the part header
          const partHeaderEnd = textPart.indexOf('\r\n\r\n');
          const partHeaderEndLF = textPart.indexOf('\n\n');
          if (partHeaderEnd !== -1) {
            messageBody = textPart.substring(partHeaderEnd + 4);
          } else if (partHeaderEndLF !== -1) {
            messageBody = textPart.substring(partHeaderEndLF + 2);
          } else {
            messageBody = textPart;
          }
        }
      }

      let cleanBody = messageBody;
      cleanBody = cleanBody.replace(/<[^>]*>/g, ' '); // Strip HTML tags
      cleanBody = cleanBody.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' '); // Replace non-breaking spaces
      cleanBody = cleanBody.replace(/\s+/g, ' ').trim(); // Normalize whitespace

      // 4. Forward to the Next.js Backend
      // Configure NEXTJS_API_URL in your Cloudflare Worker Settings (e.g., https://mymobpay.tech/api/webhook/email)
      const apiUrl = env.NEXTJS_API_URL || 'https://mymobpay.tech/api/webhook/email';

      console.log(`🚀 Forwarding email for API Key [${apiKey}] to ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cloudflare-email-routing': 'true'
        },
        body: JSON.stringify({
          api_key: apiKey,
          from: message.from,
          body: cleanBody
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Next.js backend rejected the email:', responseData);
      } else {
        console.log('✅ Email successfully processed by Next.js backend:', responseData);
      }

    } catch (err) {
      console.error('❌ Cloudflare Worker Error:', err.message);
    }
  }
};
