export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/host-guide.html",
      permanent: false,
    },
  };
}

export default function HostGuideRedirect() {
  return null;
}
