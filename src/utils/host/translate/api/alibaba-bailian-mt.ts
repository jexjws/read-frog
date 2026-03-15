import type { LangCodeISO6391 } from "@read-frog/definitions"
import type { APIProviderConfig } from "@/types/config/provider"
import type { ArticleContent } from "@/types/content"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { LANG_CODE_TO_EN_NAME } from "@read-frog/definitions"
import { generateText } from "ai"
import { DEFAULT_PROVIDER_CONFIG } from "@/utils/constants/providers"

export async function alibabaBailianMTTranslate(
  sourceText: string,
  fromLang: LangCodeISO6391 | "auto",
  toLang: LangCodeISO6391,
  providerConfig: APIProviderConfig & {
    baseURL: string
    model: {
      model: string
      isCustomModel: boolean
      customModel: string | null
    }
  },
  options?: {
    forceBackgroundFetch?: boolean
    content?: ArticleContent
  },
): Promise<string> {
  const baseURL = providerConfig.baseURL || DEFAULT_PROVIDER_CONFIG["alibaba-bailian-mt"].baseURL
  const apiKey = providerConfig.apiKey
  const modelId = providerConfig.model.isCustomModel
    ? providerConfig.model.customModel?.trim()
    : providerConfig.model.model?.trim()

  if (!baseURL)
    throw new Error("Alibaba Bailian MT baseURL is not configured")
  if (!apiKey)
    throw new Error("Alibaba Bailian MT API key is not configured")
  if (!modelId)
    throw new Error("Alibaba Bailian MT model is not configured")

  // Format language to Alibaba Bailian MT required names
  const formatLang = (lang: LangCodeISO6391 | "auto") => {
    if (lang === "auto")
      return "auto"
    return LANG_CODE_TO_EN_NAME[lang as keyof typeof LANG_CODE_TO_EN_NAME] || lang
  }

  // Build translation parameters
  const translationOptions: Record<string, any> = {
    source_lang: formatLang(fromLang),
    target_lang: formatLang(toLang),
  }

  // Inject AI context into domains field for better translation
  if (options?.content) {
    const domains: string[] = []
    domains.push(`The sentence is part of a webpage. `)
    if (options.content.title)
      domains.push(`Article Title: ${options.content.title}`)
    if (options.content.summary)
      domains.push(`Article Summary: ${options.content.summary}`)
    domains.push(` Translate based on page information.`)
    translationOptions.domains = domains.join(" ")
  }

  // Create OpenAI-compatible provider instance
  const bailianMT = createOpenAICompatible({
    name: "alibaba-bailian-mt",
    apiKey,
    baseURL,
    // Force translation_options to root level of request body
    transformRequestBody: body => ({
      ...body,
      translation_options: translationOptions,
    }),
  })

  const { text: translatedText } = await generateText({
    model: bailianMT.languageModel(modelId),
    prompt: sourceText,
    maxRetries: 0,
  })

  return translatedText.trim()
}
