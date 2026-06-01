export const SLIDE_PPTX_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Editable Slide Template" name="pptx_basic_template">
  <Theme name="light" />

  <Slide id="cover" title="Cover" width={1280} height={720}>
    <Shape x={0} y={0} w={1280} h={720} fill="#F7F9FC" />
    <Shape x={72} y={68} w={92} h={5} fill="#245BDB" />
    <TextBox x={72} y={112} w={520} h={26} fontSize={12} color="#667085">POWERPOINT EDITABLE TEMPLATE</TextBox>
    <Title x={72} y={172} w={840} h={120} fontSize={46}>Simple executive slide built from editable PowerPoint objects</Title>
    <Subtitle x={76} y={320} w={720} h={62} fontSize={18} color="#475467">This template avoids charts and complex HTML so the export can be compared visually against the browser preview.</Subtitle>
    <Shape x={72} y={470} w={330} h={116} fill="#FFFFFF" stroke="#D0D5DD" />
    <TextBox x={98} y={496} w={270} h={24} fontSize={13} color="#667085">Object 01</TextBox>
    <TextBox x={98} y={532} w={260} h={36} fontSize={21} color="#101828">Editable text boxes</TextBox>
    <Shape x={438} y={470} w={330} h={116} fill="#FFFFFF" stroke="#D0D5DD" />
    <TextBox x={464} y={496} w={270} h={24} fontSize={13} color="#667085">Object 02</TextBox>
    <TextBox x={464} y={532} w={260} h={36} fontSize={21} color="#101828">Editable shapes</TextBox>
    <Shape x={804} y={470} w={330} h={116} fill="#245BDB" stroke="#245BDB" />
    <TextBox x={830} y={496} w={270} h={24} fontSize={13} color="#DCE8FF">Object 03</TextBox>
    <TextBox x={830} y={532} w={260} h={36} fontSize={21} color="#FFFFFF">Editable cards</TextBox>
    <Footer x={72} y={662} w={1136} h={24}>Slide 1 / 3 • Basic PPTX export fidelity test</Footer>
  </Slide>

  <Slide id="content" title="Content" width={1280} height={720}>
    <Shape x={0} y={0} w={1280} h={720} fill="#FFFFFF" />
    <Shape x={72} y={58} w={92} h={5} fill="#245BDB" />
    <Title x={72} y={92} w={940} h={88} fontSize={34}>The exported slide should preserve position, size, color and hierarchy</Title>
    <Subtitle x={76} y={185} w={760} h={42} fontSize={16} color="#475467">This page uses only deterministic components: Title, Subtitle, TextBox, Shape, Card and Stat.</Subtitle>
    <Stat x={72} y={275} w={260} h={126} label="Text objects" value="12" delta="Editable in PowerPoint" />
    <Stat x={370} y={275} w={260} h={126} label="Shape objects" value="6" delta="Editable fill and border" />
    <Stat x={668} y={275} w={260} h={126} label="Slides" value="3" delta="Same dimensions" />
    <Card x={72} y={458} w={860} h={108}>
      <TextBox x={100} y={486} w={780} h={30} fontSize={22} color="#101828">What to check after opening PowerPoint</TextBox>
      <TextBox x={100} y={528} w={760} h={28} fontSize={14} color="#475467">Select the title, cards and KPI numbers. They should be native editable objects, not screenshots.</TextBox>
    </Card>
    <Footer x={72} y={662} w={1136} h={24}>Slide 2 / 3 • Visual fidelity and editability</Footer>
  </Slide>

  <Slide id="closing" title="Closing" width={1280} height={720}>
    <Shape x={0} y={0} w={1280} h={720} fill="#101828" />
    <Shape x={72} y={68} w={92} h={5} fill="#84CAFF" />
    <TextBox x={72} y={120} w={500} h={26} fontSize={12} color="#98A2B3">FINAL CHECK</TextBox>
    <Title x={72} y={180} w={800} h={118} fontSize={44} color="#FFFFFF">If this looks close, the PPTX path is working</Title>
    <Subtitle x={76} y={330} w={720} h={58} fontSize={18} color="#D0D5DD">The next step after this basic test is improving complex layouts and query-driven data hydration.</Subtitle>
    <Shape x={76} y={470} w={300} h={96} fill="#1D2939" stroke="#475467" />
    <TextBox x={104} y={498} w={240} h={30} fontSize={21} color="#FFFFFF">Native objects</TextBox>
    <TextBox x={104} y={534} w={230} h={22} fontSize={13} color="#D0D5DD">Editable after export</TextBox>
    <Shape x={412} y={470} w={300} h={96} fill="#1D2939" stroke="#475467" />
    <TextBox x={440} y={498} w={240} h={30} fontSize={21} color="#FFFFFF">No screenshots</TextBox>
    <TextBox x={440} y={534} w={230} h={22} fontSize={13} color="#D0D5DD">For these components</TextBox>
    <Footer x={72} y={662} w={1136} h={24} color="#98A2B3">Slide 3 / 3 • Basic PPTX export fidelity test</Footer>
  </Slide>
</SlideTemplate>`
