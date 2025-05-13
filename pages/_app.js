import { useEffect } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-PYRX4X3TPM';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID);
    }
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
