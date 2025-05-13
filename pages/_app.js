function MyApp({ Component, pageProps }) {
  return (
    <>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PYRX4X3TPM"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PYRX4X3TPM');
            `,
          }}
        ></script>
      </head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

