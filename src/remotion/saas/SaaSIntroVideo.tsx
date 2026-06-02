import { Sequence } from 'remotion'

import {
  SaaSHeroIntroScene,
  SaaSIntegrationsScene,
  SaaSMetricsImpactScene,
  SaaSOutroScene,
  SaaSProblemToSolutionScene,
  SaaSProductTourScene,
  SaaSWorkflowAutomationScene,
} from '@/remotion/saas/scenes'
import { resolveSaaSTheme } from '@/remotion/saas/theme'
import type { SaaSIntroScene, SaaSIntroVideoConfig } from '@/remotion/saas/types'

export const DEFAULT_SAAS_SCENE_DURATION = 150
export const DEFAULT_SAAS_INTRO_FPS = 30
export const DEFAULT_SAAS_INTRO_WIDTH = 1920
export const DEFAULT_SAAS_INTRO_HEIGHT = 1080

export function getSaaSIntroDurationInFrames(config: SaaSIntroVideoConfig) {
  return config.scenes.reduce((total, scene) => total + (scene.duration || DEFAULT_SAAS_SCENE_DURATION), 0)
}

function renderScene(scene: SaaSIntroScene, config: SaaSIntroVideoConfig) {
  const theme = resolveSaaSTheme(config.brand)
  if (scene.type === 'hero') return <SaaSHeroIntroScene brand={config.brand} scene={scene} theme={theme} />
  if (scene.type === 'problem') return <SaaSProblemToSolutionScene brand={config.brand} scene={scene} theme={theme} />
  if (scene.type === 'product-tour') return <SaaSProductTourScene brand={config.brand} scene={scene} theme={theme} />
  if (scene.type === 'workflow') return <SaaSWorkflowAutomationScene brand={config.brand} scene={scene} theme={theme} />
  if (scene.type === 'integrations') return <SaaSIntegrationsScene brand={config.brand} scene={scene} theme={theme} />
  if (scene.type === 'metrics') return <SaaSMetricsImpactScene brand={config.brand} scene={scene} theme={theme} />
  return <SaaSOutroScene brand={config.brand} scene={scene} theme={theme} />
}

export function SaaSIntroVideo({ config }: { config: SaaSIntroVideoConfig }) {
  let from = 0
  return (
    <>
      {config.scenes.map((scene, index) => {
        const duration = scene.duration || DEFAULT_SAAS_SCENE_DURATION
        const sequence = (
          <Sequence key={`${scene.type}-${index}`} from={from} durationInFrames={duration}>
            {renderScene(scene, config)}
          </Sequence>
        )
        from += duration
        return sequence
      })}
    </>
  )
}
