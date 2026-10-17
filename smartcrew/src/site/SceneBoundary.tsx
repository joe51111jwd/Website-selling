// One section that fails (its chunk didn't load, or it threw while rendering) drops out on its own
// instead of taking the whole page down with it: the rest of the page and its buttons keep working.

import { Component, type ReactNode } from "react";

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[smartcrew] a section failed and was left out", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
