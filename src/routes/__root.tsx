import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SentimentAI — NLP Sentiment Analysis Dashboard" },
      { name: "description", content: "Real-time sentiment analysis powered by Hugging Face NLP models. Analyze single texts or batch CSV/Excel datasets." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "SentimentAI — NLP Sentiment Dashboard" },
      { property: "og:description", content: "Real-time sentiment analysis with NLP machine learning models." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
          {/* Ambient background */}
          <div className="pointer-events-none fixed inset-0 -z-10 grid-bg" />
          <div className="pointer-events-none fixed -top-32 -left-32 -z-10 h-[480px] w-[480px] rounded-full bg-primary/30 blur-3xl animate-blob" />
          <div className="pointer-events-none fixed top-1/3 -right-40 -z-10 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
          <div className="pointer-events-none fixed -bottom-40 left-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />

          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-white/10 bg-background/40 px-4 backdrop-blur-xl">
              <SidebarTrigger />
              <div className="text-sm font-medium text-muted-foreground">
                Sentiment Analysis Platform
              </div>
            </header>
            <main className="flex-1">
              <div key={location.pathname} className="animate-page-fade-in">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
