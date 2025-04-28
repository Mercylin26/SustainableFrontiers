import { useState } from "react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

export function PasswordInput({ id, placeholder, value, onChange, name, ...props }: PasswordInputProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
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
        <span className="material-icons text-lg">
          {showPassword ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

export function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center space-x-1">
        <input 
          type="checkbox" 
          id="show-password" 
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
          className="rounded text-primary focus:ring-primary"
        />
        <label htmlFor="show-password" className="text-xs text-neutral-500 cursor-pointer">
          Show password
        </label>
      </div>
    </div>
  );
}