import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Aísla la escena 3D: si WebGL falla (contexto perdido, modelo corrupto, etc.)
 * el resto de la página sigue funcionando en vez de caerse por completo.
 */
export class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[3D] escena deshabilitada:", error.message, info.componentStack);
  }

  override render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
