"use client";

import { LottieAnimation } from "@/components/shared/lottie-animation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function HeroAnimation() {
  return (
    <div className="relative">
      {/* Decorative bg */}
      <div className="absolute inset-0 rounded-3xl from-primary/5 via-primary/10 to-transparent -m-4" />
      <div className="relative">
        <DotLottieReact
          src="https://lottie.host/e9fcdda1-d424-40b3-a1a9-a82a6a3f254e/fk3I0aGVhL.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
}
