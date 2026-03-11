import type { TestSeriesObject } from "./types"
import { testSeries as v058TestSeries } from "./v058"

const LLM_PROVIDER_TYPES = new Set([
  "openai",
  "deepseek",
  "google",
  "anthropic",
  "xai",
  "openai-compatible",
  "siliconflow",
  "tensdaq",
  "ai302",
  "bedrock",
  "groq",
  "deepinfra",
  "mistral",
  "togetherai",
  "cohere",
  "fireworks",
  "cerebras",
  "replicate",
  "perplexity",
  "vercel",
  "openrouter",
  "ollama",
  "volcengine",
  "minimax",
])

type SnapshotRecord = Record<string, unknown>

function asRecord(value: unknown): SnapshotRecord | null {
  if (!value || typeof value !== "object") {
    return null
  }
  return value as SnapshotRecord
}

function asRecordArray(value: unknown): SnapshotRecord[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is SnapshotRecord => !!item && typeof item === "object")
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function isLLMProvider(provider: unknown): boolean {
  return typeof provider === "string" && LLM_PROVIDER_TYPES.has(provider)
}

function resolveAiContentAwareProviderId(config: unknown): string {
  const configRecord = asRecord(config)
  const providersConfig = asRecordArray(configRecord?.providersConfig)
  const translateConfig = asRecord(configRecord?.translate)
  const translateProviderId = toNonEmptyString(translateConfig?.providerId)

  if (translateProviderId) {
    const translateProviderConfig = providersConfig.find(provider => toNonEmptyString(provider.id) === translateProviderId)
    if (translateProviderConfig && isLLMProvider(translateProviderConfig.provider)) {
      return translateProviderId
    }
  }

  const firstEnabledLLMProvider = providersConfig.find(
    provider => provider.enabled !== false && isLLMProvider(provider.provider),
  )
  const firstEnabledLLMProviderId = firstEnabledLLMProvider ? toNonEmptyString(firstEnabledLLMProvider.id) : null
  if (firstEnabledLLMProviderId) {
    return firstEnabledLLMProviderId
  }

  const firstLLMProvider = providersConfig.find(provider => isLLMProvider(provider.provider))
  const firstLLMProviderId = firstLLMProvider ? toNonEmptyString(firstLLMProvider.id) : null
  if (firstLLMProviderId) {
    return firstLLMProviderId
  }

  return "openai-default"
}

export const testSeries: TestSeriesObject = Object.fromEntries(
  Object.entries(v058TestSeries).map(([seriesId, seriesData]) => {
    const baseConfig = seriesData.config
    const translateConfig = asRecord(baseConfig.translate)
    const aiContentAwareProviderId = resolveAiContentAwareProviderId(baseConfig)

    const newConfig = { ...baseConfig } as Record<string, unknown>
    if ("aiContentAware" in newConfig) {
      delete newConfig.aiContentAware
    }

    const newTranslateConfig = { ...(translateConfig || {}) } as Record<string, unknown>
    const enableAIContentAware = typeof newTranslateConfig.enableAIContentAware === "boolean"
      ? newTranslateConfig.enableAIContentAware
      : false

    if ("enableAIContentAware" in newTranslateConfig) {
      delete newTranslateConfig.enableAIContentAware
    }

    newTranslateConfig.aiContentAware = {
      enabled: enableAIContentAware,
      providerId: aiContentAwareProviderId,
    }

    newConfig.translate = newTranslateConfig

    return [
      seriesId,
      {
        ...seriesData,
        description: "Migrates to translate.aiContentAware structure",
        config: newConfig,
      },
    ]
  }),
) as TestSeriesObject
