import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--fg))]",
        secondary: "border border-line-strong bg-raised text-fg hover:border-fg-faint hover:bg-subtle",
        ghost: "text-fg-muted hover:bg-subtle hover:text-fg",
      },
      size: {
        // 보이는 높이 36px, 터치 영역은 위아래 5px씩 넓혀 44px 이상 (지시서 3.5).
        // ::after는 패딩 박스 기준이라 1px 테두리가 있는 변형은 34 + 10 = 44px.
        sm: "h-9 px-3 text-[0.8125rem] after:absolute after:inset-x-0 after:-inset-y-[5px] md:h-8 md:after:hidden",
        md: "h-11 px-4 text-sm md:h-10",
        icon: "h-11 w-11 md:h-9 md:w-9",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
