import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { NuqsAdapter } from "nuqs/adapters/react";
import App from "./App";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

createRoot(document.getElementById("root")!).render(
  <NuqsAdapter>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </NuqsAdapter>
);
