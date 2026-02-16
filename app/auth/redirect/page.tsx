"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {

  const router = useRouter();

  useEffect(() => {

    router.replace("/dashboard");

  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <p>Logging you in...</p>
    </div>
  );
}
