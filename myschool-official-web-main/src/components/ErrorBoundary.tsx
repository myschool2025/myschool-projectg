import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
          <Alert className="max-w-md w-full text-center">
            <AlertTitle className="text-2xl font-bold mb-2">Oops! Something went wrong.</AlertTitle>
            <AlertDescription className="mb-4 text-gray-600">
              An unexpected error occurred. Please try refreshing the page.
            </AlertDescription>
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCcw size={18} /> Refresh Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
