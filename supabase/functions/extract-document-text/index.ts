import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { sanitizeApiBaseUrl } from "../_shared/safeApiUrl.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract text from DOCX (which is a ZIP of XML files)
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(arrayBuffer);

    // Get the main document content
    const documentXml = await contents.file('word/document.xml')?.async('string');
    if (!documentXml) {
      throw new Error('No document.xml found in DOCX');
    }

    // Parse the XML and extract text content
    // Remove XML tags and extract text between <w:t> tags
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const paragraphBreaks = documentXml.match(/<\/w:p>/g) || [];

    let text = '';
    let lastIndex = 0;

    // Simple text extraction - get all text between w:t tags
    const allText: string[] = [];
    let currentParagraph: string[] = [];

    // Split by paragraph markers
    const paragraphs = documentXml.split(/<\/w:p>/);

    for (const para of paragraphs) {
      const matches = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      const paraText = matches.map(match => {
        const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
        return textMatch ? textMatch[1] : '';
      }).join('');

      if (paraText.trim()) {
        allText.push(paraText);
      }
    }

    return allText.join('\n\n');
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Extract text from documents (PDF or Image) using AI with enhanced OCR
async function extractTextWithAI(arrayBuffer: ArrayBuffer, apiKey: string, apiBaseUrl: string, model: string, fileType: string): Promise<string> {
  const base64 = encodeBase64(arrayBuffer);
  const mimeType = fileType || 'application/pdf';
  const dataUri = `data:${mimeType};base64,${base64}`;

  console.log(`Sending request to AI Gateway at ${apiBaseUrl} for content extraction (${mimeType}, size: ${arrayBuffer.byteLength} bytes)`);

  const response = await fetch(apiBaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert document analyzer and high-precision OCR specialist. 
Your task is to extract ALL content from the provided ${mimeType.includes('pdf') ? 'PDF document' : 'image'} with 100% accuracy.

EXTRACTION RULES:
1. Extract every single word, number, and table exactly as shown.
2. If it is a PDF, process all visible pages/content.
3. Preserve the hierarchical structure (headings, sub-headings, lists).
4. For Arabic content: Ensure correct character order and preserve diacritics (تَشْكِيل).
5. For tables: Use markdown format.
6. If the document is a scanned image/PDF, perform deep OCR and ignore background noise.
7. Return ONLY the text content. No commentary, no introduction, no conclusions.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all verbatim text from this ${mimeType.includes('pdf') ? 'PDF' : 'image'} file. Maintain all formatting, tables, and structure.`
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUri
              }
            }
          ]
        }
      ],
      max_tokens: 16384, // Reduced from 64k to avoid gateway limits
      temperature: 0,
    }),
  });

  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = 'Could not read error response';
    }

    console.error('AI extraction error:', response.status, errorText);

    if (response.status === 429) {
      throw new Error('Rate limit exceeded for AI extraction. Please try again in a moment.');
    }

    if (response.status === 413) {
      throw new Error('File is too large for AI extraction. Try a smaller file.');
    }

    throw new Error(`AI Gateway error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content || '';

  if (!content && aiResponse.error) {
    throw new Error(`AI error: ${aiResponse.error.message || JSON.stringify(aiResponse.error)}`);
  }

  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { storagePath, materialId, fileType } = await req.json();
    console.log(`Processing document extraction for material ${materialId}, type: ${fileType}, path: ${storagePath}`);

    if (!storagePath || !materialId) {
      return new Response(
        JSON.stringify({ error: 'Missing storagePath or materialId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the material belongs to the user
    const { data: material, error: materialError } = await supabaseClient
      .from('uploaded_materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single();

    if (materialError || !material) {
      console.error('Material not found:', materialError);
      return new Response(
        JSON.stringify({ error: 'Material not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('learning-materials')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();

    // File size validation (10MB limit)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedText = '';

    // Determine file type and extract accordingly
    let detectedMimeType = fileType;
    if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
      if (storagePath?.toLowerCase().endsWith('.pdf')) detectedMimeType = 'application/pdf';
      else if (storagePath?.toLowerCase().endsWith('.png')) detectedMimeType = 'image/png';
      else if (storagePath?.toLowerCase().endsWith('.jpg') || storagePath?.toLowerCase().endsWith('.jpeg')) detectedMimeType = 'image/jpeg';
      else if (storagePath?.toLowerCase().endsWith('.webp')) detectedMimeType = 'image/webp';
      else if (storagePath?.toLowerCase().endsWith('.docx')) detectedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    const isDocx = detectedMimeType?.includes('word') ||
      detectedMimeType?.includes('docx') ||
      storagePath?.toLowerCase().endsWith('.docx');

    const isDoc = detectedMimeType?.includes('msword') ||
      storagePath?.toLowerCase().endsWith('.doc');

    const isPdf = detectedMimeType?.includes('pdf') ||
      storagePath?.toLowerCase().endsWith('.pdf');

    const isImage = detectedMimeType?.includes('image/') ||
      ['.png', '.jpg', '.jpeg', '.webp'].some(ext => storagePath?.toLowerCase().endsWith(ext));

    console.log(`File type detection: isDocx=${isDocx}, isDoc=${isDoc}, isPdf=${isPdf}, isImage=${isImage}, mime=${detectedMimeType}`);

    if (isDocx) {
      // Extract DOCX text directly using JSZip
      console.log('Extracting DOCX content...');
      extractedText = await extractDocxText(arrayBuffer);
      console.log(`Extracted ${extractedText.length} characters from DOCX`);
    } else if (isPdf || isImage) {
      // Use AI to extract text from PDF or Image
      // 1. Try to get user's personal API key first as a priority
      const { data: profile } = await serviceClient
        .from('user_api_credentials')
        .select('gemini_api_key, openai_api_key, custom_api_key, custom_base_url, custom_model')
        .eq('user_id', userId)
        .maybeSingle();

      let apiBaseUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      let model = 'google/gemini-3-flash-preview';
      let apiKey = Deno.env.get('LOVABLE_API_KEY');

      // Priority 1: User's Custom key
      if (profile?.custom_api_key) {
        apiKey = profile.custom_api_key;
        apiBaseUrl = sanitizeApiBaseUrl(profile.custom_base_url, 'https://api.openai.com/v1/chat/completions');
        model = profile.custom_model || 'gpt-4o-mini';
        console.log('Using personal Custom API key for extraction');
      }
      // Priority 2: User's Gemini key
      else if (profile?.gemini_api_key) {
        apiKey = profile.gemini_api_key;
        apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/chat/completions';
        model = 'gemini-2.0-flash';
        console.log('Using user provided Gemini API key for extraction');
      }
      // Priority 3: User's OpenAI key
      else if (profile?.openai_api_key) {
        apiKey = profile.openai_api_key;
        apiBaseUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini';
        console.log('Using user provided OpenAI API key for extraction');
      }

      if (!apiKey) {
        console.error('No API key found (LOVABLE_API_KEY or user key)');
        return new Response(
          JSON.stringify({
            error: 'AI Extraction not configured. Please add your Gemini API key in your Profile to enable this feature.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Extracting ${isPdf ? 'PDF' : 'Image'} content using AI...`);
      try {
        extractedText = await extractTextWithAI(arrayBuffer, apiKey!, apiBaseUrl, model, detectedMimeType || 'application/pdf');
        console.log(`Extracted ${extractedText.length} characters using AI`);
      } catch (aiError) {
        console.error('AI Extraction failed:', aiError);
        // If it failed and we were using a user key, maybe try the system key if it's different
        if (profile && (profile.custom_api_key || profile.gemini_api_key || profile.openai_api_key) && Deno.env.get('LOVABLE_API_KEY') && apiKey !== Deno.env.get('LOVABLE_API_KEY')) {
          console.log('User key failed, trying system key...');
          apiKey = Deno.env.get('LOVABLE_API_KEY')!;
          apiBaseUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
          model = 'google/gemini-3-flash-preview';
          extractedText = await extractTextWithAI(arrayBuffer, apiKey, apiBaseUrl, model, detectedMimeType || 'application/pdf');
        } else {
          throw aiError;
        }
      }
    } else if (isDoc) {
      // Old .doc format - we can't easily parse this without complex libraries
      // Return a message asking user to convert to DOCX
      return new Response(
        JSON.stringify({
          error: 'Old .doc format is not supported. Please save the file as .docx and re-upload.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type for extraction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!extractedText || extractedText.trim().length < 5) {
      console.warn('No text extracted from document or extracted text is too short');
      return new Response(
        JSON.stringify({
          error: 'No text could be extracted from the document. The file may be empty, or contain only non-searchable content.',
          success: false
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the material with extracted content using service role
    // serviceClient is already initialized above

    // Truncate if too long (max 100KB)
    const truncatedText = extractedText.length > 100000
      ? extractedText.substring(0, 100000) + '\n\n[Content truncated...]'
      : extractedText;

    const { error: updateError } = await serviceClient
      .from('uploaded_materials')
      .update({ content: truncatedText })
      .eq('id', materialId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to save extracted content');
    }

    console.log(`Successfully saved ${truncatedText.length} characters for material ${materialId}`);

    return new Response(
      JSON.stringify({
        success: true,
        contentLength: truncatedText.length,
        preview: truncatedText.substring(0, 300) + '...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in extract-document-text:', errorMessage, error);

    return new Response(
      JSON.stringify({
        error: `Extraction failed: ${errorMessage}`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
