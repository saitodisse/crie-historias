import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-slate max-w-none break-words dark:prose-invert",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ className, ...props }) => (
            <h1
              className={cn(
                "mb-4 mt-6 text-3xl font-bold leading-tight",
                className
              )}
              {...props}
            />
          ),
          h2: ({ className, ...props }) => (
            <h2
              className={cn(
                "mb-4 mt-6 text-2xl font-semibold leading-tight",
                className
              )}
              {...props}
            />
          ),
          h3: ({ className, ...props }) => (
            <h3
              className={cn(
                "mb-2 mt-4 text-xl font-semibold leading-tight",
                className
              )}
              {...props}
            />
          ),
          p: ({ className, ...props }) => (
            <p className={cn("mb-4 leading-relaxed", className)} {...props} />
          ),
          ul: ({ className, ...props }) => (
            <ul className={cn("mb-4 ml-6 list-disc", className)} {...props} />
          ),
          ol: ({ className, ...props }) => (
            <ol
              className={cn("mb-4 ml-6 list-decimal", className)}
              {...props}
            />
          ),
          li: ({ className, ...props }) => (
            <li className={cn("mb-1 pl-1", className)} {...props} />
          ),
          blockquote: ({ className, ...props }) => (
            <blockquote
              className={cn(
                "border-l-4 border-primary/50 pl-4 italic text-muted-foreground",
                className
              )}
              {...props}
            />
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4">
                <code className={cn("font-mono text-sm", className)} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-primary",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
