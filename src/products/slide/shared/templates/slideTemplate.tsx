'use client'

import React from 'react'

type MarkerProps = {
  children?: React.ReactNode
  id?: string
  name?: string
  title?: string
}

function SlideTemplateMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ThemeMarker() {
  return null
}

function SlideMarker({ children }: MarkerProps) {
  return <>{children}</>
}

SlideTemplateMarker.displayName = 'SlideTemplate'
ThemeMarker.displayName = 'Theme'
SlideMarker.displayName = 'Slide'

export const SLIDE_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Apresentação Executiva" name="deck_estatico">
  <Theme name="light" />

  <Slide id="capa" title="Capa">
    <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 56, backgroundColor: '#F4F8FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '58%' }}>
          <div style={{ width: 112, height: 10, backgroundColor: '#2F6FED', borderRadius: 999 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#56709A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Q4 2025 SLIDE RUNTIME REVIEW</p>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>Quarterly Slide</h1>
            <h1 style={{ margin: 0, marginTop: -8, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>HTML Presentation</h1>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: '#4F607E', maxWidth: '88%' }}>
            This deck runs on a pure HTML slide renderer. The goal is deterministic spacing and stable navigation before reintroducing charts or data widgets.
          </p>
        </div>

        <article style={{ width: '30%', padding: 22, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB', borderRadius: 24 }}>
          <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Presentation Focus</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>Stable slide geometry on first load and on return navigation</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>HTML-first structure instead of dashboard widgets</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>Feature growth only after layout reliability is proven</p>
          </div>
        </article>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
        <article style={{ flex: 3, padding: 24, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB', borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Renderer direction</p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1B2538', letterSpacing: '-0.03em' }}>Slide runtime separated from dashboard runtime</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 20, backgroundColor: '#F6FAFF' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#6C7FA0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 15, lineHeight: 1.6, color: '#31415E' }}>Slide layout borrowed generic BI runtime behavior designed for fluid dashboards.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 20, backgroundColor: '#F6FAFF' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#6C7FA0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Now</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 15, lineHeight: 1.6, color: '#31415E' }}>Slides are composed as pure HTML inside one fixed frame with explicit spacing.</p>
            </div>
          </div>
        </article>

        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <article style={{ padding: 22, backgroundColor: '#2F6FED', borderRadius: 24 }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#BFD6FF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Narrative</p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#FFFFFF' }}>
              The current target is simple: no visual drift between initial load, next slide and return to the first slide.
            </p>
          </article>
          <article style={{ padding: 22, backgroundColor: '#E9F2FF', border: '1px solid #D9E6FB', borderRadius: 24 }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Format</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#33425F' }}>
              Charts and tables stay out of the critical path until the slide surface itself stops breaking.
            </p>
          </article>
        </div>
      </div>
    </section>
  </Slide>

  <Slide id="summary" title="Summary">
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%', padding: 44, backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Executive summary</p>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>Why slide runtime must be independent</h2>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#5C687C' }}>Slides expose geometry bugs that dashboards can hide with natural page flow.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Layout model</p>
          <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>Fixed frame</h3>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Every slide has to stay inside one rigid 16:9 surface.</p>
        </article>
        <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Composition</p>
          <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>HTML first</h3>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Text and structure use raw HTML tags instead of BI abstractions.</p>
        </article>
        <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evolution path</p>
          <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>Widgets later</h3>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Reintroduce special widgets only after geometry stays stable through navigation.</p>
        </article>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flex: 1 }}>
        <article style={{ flex: 3, backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operational reasoning</p>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Slides require stricter layout than dashboards</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>Dashboards are fluid. When content grows, the page can keep expanding.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>Slides are bounded. A small reflow bug becomes visible immediately because the frame is fixed.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>The previous shared runtime blurred those constraints and leaked dashboard behavior into slides.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>The new runtime narrows the surface area until slide layout is fully predictable.</p>
            </div>
          </div>
        </article>

        <article style={{ flex: 2, backgroundColor: '#172033', borderRadius: 24, padding: 24 }}>
          <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#AFC0E3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Key takeaways</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Slide rendering must optimize for fixed geometry, not general-purpose widget reuse.</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>HTML handles structure and spacing better than over-abstracted layout widgets in this context.</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Feature reintroduction should happen incrementally after the frame stops drifting.</p>
        </article>
      </div>
    </section>
  </Slide>

  <Slide id="roadmap" title="Roadmap">
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', padding: 44, backgroundColor: '#F8FAFD' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', backgroundColor: '#EAF2FF', border: '1px solid #D7E5FF', borderRadius: 999, padding: '6px 12px', fontSize: 12, color: '#2159C5' }}>Next phase</span>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>Controlled evolution path</h2>
        </div>
        <p style={{ margin: 0, maxWidth: '34%', fontSize: 14, color: '#5C687C', lineHeight: 1.6 }}>
          Feature growth returns only after layout stability is proven under slide navigation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, flex: 1 }}>
        <article style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 1</p>
          <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Static slides</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#33425F' }}>Validate frame, spacing, navigation and zoom with pure HTML composition only.</p>
        </article>
        <article style={{ backgroundColor: '#172033', borderRadius: 24, padding: 22 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#AFC0E3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 2</p>
          <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.03em' }}>One widget at a time</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Bring charts back only through slide-specific wrappers, never through dashboard runtime.</p>
        </article>
        <article style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 3</p>
          <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Data-rich slides</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#33425F' }}>Only after stability, reintroduce tables and richer widgets with regression checks.</p>
        </article>
      </div>
    </section>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE = (
  <SlideTemplateMarker title="Apresentação Executiva" name="deck_estatico">
    <ThemeMarker name="light" />

    <SlideMarker id="capa" title="Capa">
      <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 56, backgroundColor: '#F4F8FF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '58%' }}>
            <div style={{ width: 112, height: 10, backgroundColor: '#2F6FED', borderRadius: 999 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#56709A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Q4 2025 SLIDE RUNTIME REVIEW</p>
              <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>Quarterly Slide</h1>
              <h1 style={{ margin: 0, marginTop: -8, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>HTML Presentation</h1>
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: '#4F607E', maxWidth: '88%' }}>
              This deck runs on a pure HTML slide renderer. The goal is deterministic spacing and stable navigation before reintroducing charts or data widgets.
            </p>
          </div>

          <article style={{ width: '30%', padding: 22, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB', borderRadius: 24 }}>
            <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Presentation Focus</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>Stable slide geometry on first load and on return navigation</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>HTML-first structure instead of dashboard widgets</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#31415E' }}>Feature growth only after layout reliability is proven</p>
            </div>
          </article>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
          <article style={{ flex: 3, padding: 24, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB', borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Renderer direction</p>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1B2538', letterSpacing: '-0.03em' }}>Slide runtime separated from dashboard runtime</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: 16, borderRadius: 20, backgroundColor: '#F6FAFF' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#6C7FA0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 15, lineHeight: 1.6, color: '#31415E' }}>Slide layout borrowed generic BI runtime behavior designed for fluid dashboards.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 20, backgroundColor: '#F6FAFF' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#6C7FA0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Now</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 15, lineHeight: 1.6, color: '#31415E' }}>Slides are composed as pure HTML inside one fixed frame with explicit spacing.</p>
              </div>
            </div>
          </article>

          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <article style={{ padding: 22, backgroundColor: '#2F6FED', borderRadius: 24 }}>
              <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#BFD6FF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Narrative</p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#FFFFFF' }}>
                The current target is simple: no visual drift between initial load, next slide and return to the first slide.
              </p>
            </article>
            <article style={{ padding: 22, backgroundColor: '#E9F2FF', border: '1px solid #D9E6FB', borderRadius: 24 }}>
              <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6C7FA0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Format</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#33425F' }}>
                Charts and tables stay out of the critical path until the slide surface itself stops breaking.
              </p>
            </article>
          </div>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="summary" title="Summary">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%', padding: 44, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Executive summary</p>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>Why slide runtime must be independent</h2>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#5C687C' }}>Slides expose geometry bugs that dashboards can hide with natural page flow.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Layout model</p>
            <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>Fixed frame</h3>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Every slide has to stay inside one rigid 16:9 surface.</p>
          </article>
          <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Composition</p>
            <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>HTML first</h3>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Text and structure use raw HTML tags instead of BI abstractions.</p>
          </article>
          <article style={{ backgroundColor: '#F9FBFF', border: '1px solid #E5ECF8', borderRadius: 22, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evolution path</p>
            <h3 style={{ margin: '12px 0 8px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>Widgets later</h3>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#6C7688' }}>Reintroduce special widgets only after geometry stays stable through navigation.</p>
          </article>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flex: 1 }}>
          <article style={{ flex: 3, backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operational reasoning</p>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Slides require stricter layout than dashboards</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>Dashboards are fluid. When content grows, the page can keep expanding.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>Slides are bounded. A small reflow bug becomes visible immediately because the frame is fixed.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>The previous shared runtime blurred those constraints and leaked dashboard behavior into slides.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 18, backgroundColor: '#F7F9FC' }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#42516A' }}>The new runtime narrows the surface area until slide layout is fully predictable.</p>
              </div>
            </div>
          </article>

          <article style={{ flex: 2, backgroundColor: '#172033', borderRadius: 24, padding: 24 }}>
            <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#AFC0E3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Key takeaways</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Slide rendering must optimize for fixed geometry, not general-purpose widget reuse.</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>HTML handles structure and spacing better than over-abstracted layout widgets in this context.</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Feature reintroduction should happen incrementally after the frame stops drifting.</p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="roadmap" title="Roadmap">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', padding: 44, backgroundColor: '#F8FAFD' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', backgroundColor: '#EAF2FF', border: '1px solid #D7E5FF', borderRadius: 999, padding: '6px 12px', fontSize: 12, color: '#2159C5' }}>Next phase</span>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>Controlled evolution path</h2>
          </div>
          <p style={{ margin: 0, maxWidth: '34%', fontSize: 14, color: '#5C687C', lineHeight: 1.6 }}>
            Feature growth returns only after layout stability is proven under slide navigation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, flex: 1 }}>
          <article style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 1</p>
            <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Static slides</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#33425F' }}>Validate frame, spacing, navigation and zoom with pure HTML composition only.</p>
          </article>
          <article style={{ backgroundColor: '#172033', borderRadius: 24, padding: 22 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#AFC0E3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 2</p>
            <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.03em' }}>One widget at a time</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#FFFFFF' }}>Bring charts back only through slide-specific wrappers, never through dashboard runtime.</p>
          </article>
          <article style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8', borderRadius: 24, padding: 22 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#7A879B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase 3</p>
            <h3 style={{ margin: '10px 0', fontSize: 22, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Data-rich slides</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#33425F' }}>Only after stability, reintroduce tables and richer widgets with regression checks.</p>
          </article>
        </div>
      </section>
    </SlideMarker>
  </SlideTemplateMarker>
)
