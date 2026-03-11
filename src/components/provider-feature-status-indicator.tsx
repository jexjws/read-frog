import { i18n } from "#imports"
import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { supportsBatchTranslationConfig, supportsContextInjectionConfig } from "@/types/config/provider"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { getProviderConfigById } from "@/utils/config/helpers"

export type ProviderFeatureType = "contextInjection" | "batchTranslation"

interface ProviderFeatureStatusIndicatorProps {
  providerId: string
  featureType: ProviderFeatureType
}

export function ProviderFeatureStatusIndicator({ providerId, featureType }: ProviderFeatureStatusIndicatorProps) {
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  const hasFeature = useMemo(() => {
    const providerConfig = getProviderConfigById(providersConfig, providerId)
    if (!providerConfig) {
      return false
    }

    switch (featureType) {
      case "contextInjection":
        return supportsContextInjectionConfig(providerConfig)
      case "batchTranslation":
        return supportsBatchTranslationConfig(providerConfig)
      default:
        return false
    }
  }, [providersConfig, providerId, featureType])

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <div className={`size-2 rounded-full ${hasFeature ? "bg-green-500" : "bg-orange-400"}`} />
      <span className="text-xs">
        {hasFeature
          ? i18n.t(`components.providerFeatureStatusIndicator.supported`)
          : i18n.t(`components.providerFeatureStatusIndicator.notSupported`)}
      </span>
    </div>
  )
}
