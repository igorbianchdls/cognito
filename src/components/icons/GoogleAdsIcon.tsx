interface GoogleAdsIconProps {
  className?: string;
  backgroundColor?: string;
}

export default function GoogleAdsIcon({ className = "w-4 h-4", backgroundColor = "#ffffff" }: GoogleAdsIconProps) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink" 
      id="google-ads" 
      width="512" 
      height="512" 
      enableBackground="new 0 0 510 510" 
      viewBox="0 0 510 510"
    >
      <rect width="510" height="510" fill="transparent" rx="50"/>
      <linearGradient id="SVGID_1_" x1="-150.076" x2="-11.6" y1="211.162" y2="287.973" gradientTransform="matrix(-1 0 0 1 273.535 0)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#28a265"></stop>
        <stop offset="1" stopColor="#28895e"></stop>
      </linearGradient>
      <linearGradient id="lg1">
        <stop offset="0" stopColor="#108372" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#006837"></stop>
      </linearGradient>
      <linearGradient xlinkHref="#lg1" id="SVGID_2_" x1="337.313" x2="266.231" y1="213.47" y2="170.612" gradientUnits="userSpaceOnUse"></linearGradient>
      <linearGradient id="SVGID_3_" x1="87.128" x2="225.617" y1="209.796" y2="286.614" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#7faef4"></stop>
        <stop offset="1" stopColor="#4c8df1"></stop>
      </linearGradient>
      <linearGradient id="SVGID_4_" x1="99.999" x2="99.999" y1="432.061" y2="503.306" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4256ac" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#1b1464"></stop>
      </linearGradient>
      <linearGradient xlinkHref="#lg1" id="SVGID_5_" x1="410.001" x2="410.001" y1="419.506" y2="454.067" gradientUnits="userSpaceOnUse"></linearGradient>
      <g>
        <path fill="url(#SVGID_1_)" d="m189.015 81.215 60.687 146.186 5.306 12.786 73.655 178.182c13.617 32.943 40.38 53.555 69.535 53.555h98.73c9.837 0 16.14-13.375 11.539-24.486l-160.415-387.358c-5.625-13.539-16.637-21.003-28.632-21.003h-130.029c-11.258 0-7.991 23.818-.376 42.138z"></path>
        <path fill="url(#SVGID_2_)" d="m249.702 227.401 5.306 12.786.01.025 231.712 231.712h10.198c9.837 0 16.14-13.375 11.539-24.486l-160.415-387.358c-5.625-13.539-16.637-21.003-28.632-21.003h-130.029c-11.258 0-7.991 23.818-.377 42.138z"></path>
        <path fill="url(#SVGID_3_)" d="m356.774 81.142c-7.647-18.278-28.174-18.247-35.788.073l-60.687 146.186-5.306 12.786-73.655 178.182c-13.617 32.943-40.38 53.555-69.535 53.555h-98.73c-9.837 0-16.14-13.375-11.539-24.486l160.414-387.358c5.625-13.539 16.637-22.003 28.632-22.003h130.028c11.258 0 21.591 7.941 26.864 20.654l.557 1.35z"></path>
        <path fill="url(#SVGID_4_)" d="m32.267 373.226-30.733 74.211c-4.601 11.111 1.702 24.486 11.539 24.486h98.73c29.155 0 55.917-20.612 69.535-53.555l18.661-45.143h-167.732z"></path>
        <path fill="url(#SVGID_5_)" d="m328.662 418.368c13.618 32.943 40.38 53.555 69.535 53.555h98.73c9.837 0 16.14-13.375 11.539-24.486l-30.733-74.211h-167.731z"></path>
      </g>
    </svg>
  );
}