import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { avatarParts, defaultAvatarConfig, type AvatarConfig } from "@/lib/avatar-builder";

interface SuggestInput {
  /** JPEG/PNG data URL of the reference photo (client downsizes before sending). */
  image: string;
}

const optionMenu = () =>
  avatarParts
    .map((part) => `${part.key} (${part.label}): ${part.options.map((o) => o.id).join(", ")}`)
    .join("\n");

const coerceConfig = (raw: unknown): AvatarConfig => {
  const out: AvatarConfig = { ...defaultAvatarConfig };
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  for (const part of avatarParts) {
    const value = obj[part.key];
    if (typeof value === "string" && part.options.some((o) => o.id === value)) {
      out[part.key] = value;
    }
  }
  return out;
};

/**
 * Look at a reference photo and suggest a climber avatar config.
 * Returns option ids only — the client still sanitizes against the member's
 * unlock level, so this can never grant locked gear.
 */
export const suggestAvatarFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SuggestInput) => {
    if (!input?.image?.startsWith("data:image/")) throw new Error("Expected an image data URL");
    if (input.image.length > 4_000_000) throw new Error("Image too large");
    return input;
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You design cartoon climber avatars from reference photos. Pick the option id from each list that best matches the person's appearance (skin tone, hair, facial hair, expression, eyewear, headwear, clothing colour). Be respectful and approximate; never describe the person in text. Reply with the tool call only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Choose one id per category:\n${optionMenu()}\n\nIf a category is unclear from the photo, pick a sensible mountaineering default.`,
              },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_avatar",
              description: "Set the climber avatar configuration",
              parameters: {
                type: "object",
                properties: Object.fromEntries(
                  avatarParts.map((p) => [
                    p.key,
                    { type: "string", enum: p.options.map((o) => o.id) },
                  ]),
                ),
                required: avatarParts.map((p) => p.key),
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_avatar" } },
      }),
    });

    if (response.status === 429) throw new Error("Too many requests right now — try again in a minute.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    if (!response.ok) throw new Error(`Avatar suggestion failed (${response.status})`);

    const json = (await response.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("The model did not return an avatar");

    let parsed: unknown;
    try {
      parsed = JSON.parse(args);
    } catch {
      throw new Error("The model returned an unreadable avatar");
    }

    return { config: coerceConfig(parsed) };
  });
