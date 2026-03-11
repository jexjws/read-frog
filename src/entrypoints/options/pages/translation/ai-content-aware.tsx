import { i18n } from "#imports"
import { deepmerge } from "deepmerge-ts"
import { useAtom } from "jotai"
import { HelpTooltip } from "@/components/help-tooltip"
import { ProviderFeatureStatusIndicator } from "@/components/provider-feature-status-indicator"
import { Field, FieldContent, FieldLabel } from "@/components/ui/base-ui/field"
import { Switch } from "@/components/ui/base-ui/switch"
import { configAtom, configFieldsAtomMap } from "@/utils/atoms/config"
import { ConfigCard } from "../../components/config-card"

export function AIContentAware() {
  const [translateConfig, setTranslateConfig] = useAtom(configFieldsAtomMap.translate)
  const [config] = useAtom(configAtom)

  return (
    <ConfigCard
      id="ai-content-aware"
      title={i18n.t("options.translation.aiContentAware.title")}
      description={(
        <>
          {i18n.t("options.translation.aiContentAware.description")}
          <ProviderFeatureStatusIndicator providerId={config.translate.aiContentAware.providerId} featureType="contextInjection" />
        </>
      )}
    >
      <Field orientation="horizontal">
        <FieldContent className="self-center">
          <FieldLabel htmlFor="ai-content-aware-toggle">
            {i18n.t("options.translation.aiContentAware.enable")}
            <HelpTooltip>{i18n.t("options.translation.aiContentAware.enableDescription")}</HelpTooltip>
          </FieldLabel>
        </FieldContent>
        <Switch
          id="ai-content-aware-toggle"
          checked={translateConfig.aiContentAware.enabled}
          onCheckedChange={(checked) => {
            void setTranslateConfig(
              deepmerge(translateConfig, {
                aiContentAware: {
                  enabled: checked,
                },
              }),
            )
          }}
        />
      </Field>
    </ConfigCard>
  )
}
