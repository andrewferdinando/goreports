"use client";

import SecondaryButton from "./SecondaryButton";

interface FileInputButtonProps {
  id: string;
  name: string;
  accept?: string;
  label: string;
}

export default function FileInputButton({
  id,
  name,
  accept = ".csv",
  label,
}: FileInputButtonProps) {
  return (
    <div>
      <input
        type="file"
        accept={accept}
        name={name}
        className="hidden"
        id={id}
      />
      <label htmlFor={id}>
        <SecondaryButton
          type="button"
          onClick={() => {
            const input = document.getElementById(id) as HTMLInputElement;
            input?.click();
          }}
        >
          {label}
        </SecondaryButton>
      </label>
    </div>
  );
}

