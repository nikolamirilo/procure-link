"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface LottieAnimationProps {
  url: string;
  className?: string;
  loop?: boolean;
}

export function LottieAnimation({
  url,
  className,
  loop = true,
}: LottieAnimationProps) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, [url]);

  if (!data) {
    return <div className={className} />;
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      className={className}
    />
  );
}
