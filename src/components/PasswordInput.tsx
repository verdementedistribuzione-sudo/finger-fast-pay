import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Mostra il pulsante eye (default true). */
  toggle?: boolean;
};

/**
 * Input password con toggle "occhio" per mostrare il valore in chiaro
 * mentre si scrive. Eredita lo stesso styling del classico <input>.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className, toggle = true, ...rest }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pr-11", className)}
        />
        {toggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Nascondi" : "Mostra"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
