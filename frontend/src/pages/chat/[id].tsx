import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ChatRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    router.replace("/dashboard");
  }, [id, router]);

  return null;
}
