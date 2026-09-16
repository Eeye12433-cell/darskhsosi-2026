import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeApiBaseUrl } from "../_shared/safeApiUrl.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_MESSAGE_LENGTH = 50000;
const MAX_MESSAGES = 100;

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
}

interface LearnerProfile {
  name?: string;
  educationLevel?: string;
  learningStyle?: string;
  preferredLanguage?: string;
}

interface RequestBody {
  messages: Message[];
  learnerProfile?: LearnerProfile;
  uploadedMaterials?: string[];
  materialContent?: string;
}

interface ProfileKeys {
  openai_api_key?: string | null;
  gemini_api_key?: string | null;
  custom_api_key?: string | null;
  custom_base_url?: string | null;
  custom_model?: string | null;
}

interface AiCandidate {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  label: string;
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const validateMessages = (messages: unknown): string | null => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "Invalid request: messages required";
  }
  if (messages.length > MAX_MESSAGES) {
    return "Too many messages in conversation";
  }
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return "Invalid message format";
    }
    const { role, content } = message as Partial<Message>;
    if (!role || !["system", "user", "assistant"].includes(role)) {
      return "Invalid message role";
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      return "Invalid message format";
    }
    if (role !== "system" && content.length > MAX_MESSAGE_LENGTH) {
      return "Message content too long";
    }
  }
  return null;
};

const buildSystemPrompt = ({
  learnerProfile,
  uploadedMaterials,
  materialContent,
}: {
  learnerProfile?: LearnerProfile;
  uploadedMaterials?: string[];
  materialContent?: string;
}) => {
  const name = learnerProfile?.name || "Learner";
  const level = learnerProfile?.educationLevel || "university";
  const style = learnerProfile?.learningStyle || "visual";
  const lang = learnerProfile?.preferredLanguage === "en" ? "English" : "Arabic";

  let systemPrompt = `You are "Dars Khusoosi" (درس خصوصي), an expert-level personalized educational companion.
Your mission is to guide ${name} through their learning journey with a highly adapted teaching style.

STUDENT CONTEXT:
- Level: ${level}
- Preferred Learning Style: ${style}
- Primary Language: ${lang}

TEACHING PRINCIPLES:
1. ADAPT TO LEVEL: For "elementary", use simple analogies. For "professional", use technical terminology.
2. ADAPT TO STYLE: If "visual", describe images/diagrams or use emoji-based layouts. If "practical", suggest exercises.
3. LANGUAGE CONSISTENCY: Always respond primarily in ${lang}, but you can provide key terms in both Arabic and English if helpful.
4. STRUCTURE: Use Markdown (bolding, lists, headers) to make complex topics digestible.
5. INTERACTIVITY: End your responses with a thought-provoking question to keep the learner engaged.

KNOWLEDGE BASE USAGE:`;

  if (uploadedMaterials?.length) {
    systemPrompt += `
- The learner has provided these materials: ${uploadedMaterials.join(", ")}.
- ALWAYS prioritize information from these materials if relevant to the question.
- If the materials don't cover a topic, mention it and provide general knowledge.`;

    if (materialContent) {
      systemPrompt += `

REFERENCE CONTENT FOR CONTEXT:
${materialContent.substring(0, 25000)}`;
    }
  } else {
    systemPrompt += `
- No specific materials provided. Use your general academic knowledge base.`;
  }

  return systemPrompt;
};

const enhanceExistingSystemPrompt = ({
  messages,
  learnerProfile,
  materialContent,
}: {
  messages: Message[];
  learnerProfile?: LearnerProfile;
  materialContent?: string;
}) => {
  const name = learnerProfile?.name || "Learner";
  const level = learnerProfile?.educationLevel || "university";
  const style = learnerProfile?.learningStyle || "visual";

  const updatedMessages = [...messages];
  let systemPrompt = updatedMessages[0].content;

  if (!systemPrompt.includes(name)) {
    systemPrompt = `Student: ${name} (${level} level, ${style} learner).\n${systemPrompt}`;
  }

  if (materialContent && !systemPrompt.includes("REFERENCE CONTENT")) {
    systemPrompt += `

REFERENCE CONTENT FROM KNOWLEDGE BASE:
${materialContent.substring(0, 25000)}`;
  }

  updatedMessages[0] = { ...updatedMessages[0], content: systemPrompt };
  return updatedMessages;
};

const getUserIdFromAuthHeader = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
) => {
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("Auth error:", error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Unexpected auth error:", error);
    return null;
  }
};

const getProfileKeys = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string,
  userId: string,
): Promise<ProfileKeys | null> => {
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabaseClient
    .from("user_api_credentials")
    .select("openai_api_key, gemini_api_key, custom_api_key, custom_base_url, custom_model")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch error:", error);
    return null;
  }

  return data;
};

const buildAiCandidates = ({
  profileKeys,
  defaultApiKey,
}: {
  profileKeys: ProfileKeys | null;
  defaultApiKey: string | undefined;
}): AiCandidate[] => {
  const candidates: AiCandidate[] = [];

  if (profileKeys?.custom_api_key) {
    candidates.push({
      apiBaseUrl: sanitizeApiBaseUrl(profileKeys.custom_base_url, "https://api.openai.com/v1/chat/completions"),
      apiKey: profileKeys.custom_api_key,
      model: profileKeys.custom_model || "gpt-4o-mini",
      label: "custom_api_key",
    });
  }

  if (profileKeys?.gemini_api_key) {
    candidates.push({
      apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: profileKeys.gemini_api_key,
      model: "gemini-2.0-flash",
      label: "gemini_api_key",
    });
  }

  if (profileKeys?.openai_api_key) {
    candidates.push({
      apiBaseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: profileKeys.openai_api_key,
      model: "gpt-4o-mini",
      label: "openai_api_key",
    });
  }

  if (defaultApiKey) {
    candidates.push({
      apiBaseUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: defaultApiKey,
      model: "google/gemini-3-flash-preview",
      label: "lovable_default",
    });
  }

  return candidates;
};

const requestAiResponse = async ({
  candidates,
  messages,
}: {
  candidates: AiCandidate[];
  messages: Message[];
}) => {
  let lastFailure: { status: number; text: string; label: string } | null = null;

  for (const candidate of candidates) {
    try {
      console.log(`Sending request to ${candidate.apiBaseUrl} using ${candidate.model} (${candidate.label})`);

      const response = await fetch(candidate.apiBaseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${candidate.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: candidate.model,
          messages,
          stream: true,
        }),
      });

      if (response.ok) {
        return { response, lastFailure };
      }

      const errorText = await response.text();
      console.error(`AI service error (${candidate.label}):`, response.status, errorText);
      lastFailure = { status: response.status, text: errorText, label: candidate.label };

      if (candidate.label === "lovable_default") {
        break;
      }
    } catch (error) {
      console.error(`AI request crashed (${candidate.label}):`, error);
      lastFailure = {
        status: 500,
        text: error instanceof Error ? error.message : "Unknown request error",
        label: candidate.label,
      };

      if (candidate.label === "lovable_default") {
        break;
      }
    }
  }

  return { response: null, lastFailure };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const body = (await req.json()) as RequestBody;
    const validationError = validateMessages(body.messages);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const { messages, learnerProfile, uploadedMaterials, materialContent } = body;
    const authHeader = req.headers.get("Authorization");
    const userId = await getUserIdFromAuthHeader(supabaseUrl, supabaseAnonKey, authHeader);

    let profileKeys: ProfileKeys | null = null;
    if (userId && authHeader) {
      profileKeys = await getProfileKeys(supabaseUrl, supabaseAnonKey, authHeader, userId);
    }

    const aiCandidates = buildAiCandidates({
      profileKeys,
      defaultApiKey: Deno.env.get("LOVABLE_API_KEY"),
    });

    if (aiCandidates.length === 0) {
      return jsonResponse({ error: "AI API key is not configured on the server." }, 500);
    }

    const finalMessages = messages[0]?.role === "system"
      ? enhanceExistingSystemPrompt({ messages, learnerProfile, materialContent })
      : [
          {
            role: "system" as const,
            content: buildSystemPrompt({ learnerProfile, uploadedMaterials, materialContent }),
          },
          ...messages,
        ];

    const { response: aiResponse, lastFailure } = await requestAiResponse({
      candidates: aiCandidates,
      messages: finalMessages,
    });

    if (!aiResponse) {
      if (lastFailure?.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again." }, 429);
      }
      if (lastFailure?.status === 402) {
        return jsonResponse({ error: "Usage limit reached." }, 402);
      }
      if (lastFailure?.status === 401) {
        return jsonResponse({ error: "The configured personal AI key is invalid. Please review it in your profile settings." }, 401);
      }

      console.error("All AI candidates failed:", lastFailure?.label, lastFailure?.status, lastFailure?.text);
      return jsonResponse({ error: "AI service temporarily unavailable" }, 500);
    }

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in intelligent-teacher:", error);
    return jsonResponse({ error: "Unable to process request. Please try again." }, 500);
  }
});