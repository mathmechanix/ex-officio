"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "w-full max-w-lg rounded-xl border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        className
      )}
      onClick={handleBackdropClick}
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          {title && (
            <div className="space-y-1">
              <h2
                id="dialog-title"
                className="text-lg font-semibold leading-none tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="dialog-description"
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </p>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}

export interface DialogTriggerProps {
  children: React.ReactElement;
  dialog: React.ReactNode;
}

function DialogTrigger({ children, dialog }: DialogTriggerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {React.cloneElement(children, {
        onClick: () => setOpen(true),
      } as React.HTMLAttributes<HTMLElement>)}
      {open && React.cloneElement(dialog as React.ReactElement<any>, {
        open,
        onClose: () => setOpen(false),
      })}
    </>
  );
}

export { Dialog, DialogTrigger };
