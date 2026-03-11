/**
 * Migration script from v058 to v059
 * Adds `aiContentAware.providerId` for AI smart context feature provider selection.
 *
 * IMPORTANT: All values are hardcoded inline. Migration scripts are frozen
 * snapshots — never import constants or helpers that may change.
 */

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

function resolveAiContentAwareProviderId(oldConfig: SnapshotRecord): string {
  const providersConfig = asRecordArray(oldConfig.providersConfig)
  const translateConfig = asRecord(oldConfig.translate)
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

export function migrate(oldConfig: unknown): unknown {
  const oldConfigRecord = asRecord(oldConfig)
  if (!oldConfigRecord) {
    return oldConfig
  }

  const translateConfig = asRecord(oldConfigRecord.translate)
  const existingTranslateAiContentAware = asRecord(translateConfig?.aiContentAware)
  if (existingTranslateAiContentAware) {
    return oldConfigRecord
  }

  const result = { ...oldConfigRecord }

  const oldAiContentAwareRoot = asRecord(oldConfigRecord.aiContentAware)
  const existingProviderIdFromRoot = toNonEmptyString(oldAiContentAwareRoot?.providerId)
  if ("aiContentAware" in result) {
    delete result.aiContentAware
  }

  const enableAIContentAware = typeof translateConfig?.enableAIContentAware === "boolean"
    ? translateConfig.enableAIContentAware
    : false

  const newTranslateConfig = { ...(translateConfig || {}) }
  if ("enableAIContentAware" in newTranslateConfig) {
    delete newTranslateConfig.enableAIContentAware
  }

  newTranslateConfig.aiContentAware = {
    enabled: enableAIContentAware,
    providerId: existingProviderIdFromRoot ?? resolveAiContentAwareProviderId(oldConfigRecord),
  }

  result.translate = newTranslateConfig

  return result
}
