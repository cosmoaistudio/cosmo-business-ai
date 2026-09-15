import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";
import { useRipple } from "@/motion/hooks/useRipple";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  onPointerDown,
  children,
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  const { ripples, createRipple } = useRipple();

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        "cosmo-button"
      )}
      onPointerDown={(event) => {
        createRipple(event);
        onPointerDown?.(event);
      }}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="cosmo-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {children}
    </ButtonPrimitive>
  );
}

export { Button };
