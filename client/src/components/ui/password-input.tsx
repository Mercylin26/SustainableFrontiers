import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ id, placeholder, value, onChange, name, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder || "•••••••••"}
          value={value}
          onChange={onChange}
          name={name}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export function PasswordField({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center space-x-1">
        <input 
          type="checkbox" 
          id="show-password" 
          checked={show}
          onChange={toggle}
          className="rounded text-primary focus:ring-primary"
        />
        <label htmlFor="show-password" className="text-xs text-neutral-500 cursor-pointer">
          Show password
        </label>
      </div>
    </div>
  );
}